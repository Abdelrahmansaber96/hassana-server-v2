const Notification = require('../models/Notification');
const { asyncHandler } = require('../utils/AppError');
const { sendSuccess, sendError, sendNotFound } = require('../utils/helpers');
const { Pagination } = require('../utils/pagination');
const { sendNotificationToCustomer, sendNotificationToMultipleDevices } = require('../services/push-notification-service');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  let query;
  
  // إذا كان admin، يستطيع رؤية جميع الإشعارات
  if (req.user.role === 'admin') {
    query = Notification.find({ isActive: true });
  } else if (req.user.role === 'doctor') {
    // الطبيب يستطيع رؤية:
    // 1. الإشعارات الموجهة للأطباء
    // 2. الإشعارات التي أرسلها هو
    query = Notification.find({
      $or: [
        { recipients: 'all' },
        { recipients: 'doctors' },
        { specificRecipients: req.user.id },
        { createdBy: req.user.id } // الإشعارات التي أرسلها الطبيب
      ],
      isActive: true
    });
  } else {
    // للمستخدمين الآخرين، فقط الإشعارات الخاصة بهم
    query = Notification.find({
      $or: [
        { recipients: 'all' },
        { recipients: 'staff' },
        { specificRecipients: req.user.id }
      ],
      isActive: true
    });
  }

  const pagination = new Pagination(query, req.query)
    .filter()
    .search(['title', 'message'])
    .sort()
    .limitFields()
    .paginate();

  pagination.query = pagination.query.populate('createdBy', 'name');

  const result = await pagination.execute();

  // Mark notifications as read
  const notificationIds = result.docs.map(n => n._id);
  await Notification.updateMany(
    { 
      _id: { $in: notificationIds },
      'readBy.user': { $ne: req.user.id }
    },
    { 
      $push: { readBy: { user: req.user.id } }
    }
  );

  sendSuccess(res, { notifications: result.docs }, 'Notifications fetched successfully', 200, { pagination: result.pagination });
});

// @desc    Create new notification
// @route   POST /api/notifications
// @access  Private (Admin and Doctor)
const createNotification = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  
  // التحقق من الصلاحيات: Admin أو Doctor فقط
  if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
    return sendError(res, 'ليس لديك صلاحية لإرسال الإشعارات', 403);
  }

  const Customer = require('../models/Customer');
  const Booking = require('../models/Booking');
  
  // تحديد عدد المستلمين بناءً على نوع المستلمين والتخصيص
  let recipientsCount = 0;
  let targetCustomers = [];

  if (req.body.recipients === 'customers') {
    // إذا كان الطبيب يرسل للعملاء
    if (req.user.role === 'doctor' && req.user.branch) {
      // جلب العملاء الذين لديهم حجوزات في فرع الطبيب
      const bookingsInBranch = await Booking.find({ 
        branch: req.user.branch 
      }).distinct('customer');
      
      targetCustomers = await Customer.find({
        _id: { $in: bookingsInBranch }
      });

      // تصفية حسب نوع الحيوان إذا تم تحديده
      if (req.body.animalType) {
        targetCustomers = targetCustomers.filter(customer => {
          return customer.animals && customer.animals.some(animal => 
            animal.type === req.body.animalType
          );
        });
      }

      recipientsCount = targetCustomers.length;
      
      console.log('Doctor notification:', {
        doctorBranch: req.user.branch,
        animalType: req.body.animalType,
        customersCount: recipientsCount
      });
    } 
    // إذا كان Admin يرسل للعملاء
    else if (req.user.role === 'admin') {
      if (req.body.animalType) {
        // جلب العملاء الذين لديهم حيوان من النوع المحدد
        targetCustomers = await Customer.find({
          'animals.type': req.body.animalType
        });
        recipientsCount = targetCustomers.length;
        
        console.log('Admin notification with animal filter:', {
          animalType: req.body.animalType,
          customersCount: recipientsCount
        });
      } else {
        // جميع العملاء
        recipientsCount = await Customer.countDocuments();
      }
    }
  } else if (req.body.recipients === 'specific' && req.body.specificRecipients) {
    recipientsCount = req.body.specificRecipients.length;
  } else if (req.body.recipients === 'all') {
    const User = require('../models/User');
    recipientsCount = await User.countDocuments() + await Customer.countDocuments();
  }

  // إضافة معلومات التخصيص للـ metadata
  const metadata = {
    ...(req.body.metadata || {}),
    animalType: req.body.animalType || null,
    branchSpecific: req.body.branchSpecific || false,
    branch: req.user.role === 'doctor' ? req.user.branch : null
  };

  const notification = await Notification.create({
    ...req.body,
    metadata,
    recipientsCount,
    status: req.body.scheduledAt ? 'scheduled' : 'sent'
  });

  await notification.populate('createdBy', 'name');

  // إرسال إشعارات Firebase Push للعملاء
  if (req.body.recipients === 'customers' && targetCustomers.length > 0) {
    try {
      console.log(`📤 Sending Firebase notifications to ${targetCustomers.length} customers`);
      console.log(`📋 Recipients type: ${req.body.recipients}`);
      
      // جمع جميع device tokens من العملاء
      const allDeviceTokens = [];
      targetCustomers.forEach((customer, index) => {
        console.log(`   Customer ${index + 1}: ID=${customer._id}, Tokens=${customer.deviceTokens?.length || 0}`);
        if (customer.deviceTokens && customer.deviceTokens.length > 0) {
          customer.deviceTokens.forEach(token => {
            console.log(`      ✓ Token: ${token.substring(0, 20)}...`);
          });
          allDeviceTokens.push(...customer.deviceTokens);
        }
      });

      console.log(`📊 Total device tokens collected: ${allDeviceTokens.length}`);

      if (allDeviceTokens.length > 0) {
        console.log(`🚀 Preparing Firebase message:`);
        console.log(`   Title: ${req.body.title || 'إشعار جديد'}`);
        console.log(`   Body: ${req.body.message || 'لديك إشعار جديد'}`);
        console.log(`   Type: ${req.body.type || 'general'}`);
        console.log(`   Priority: ${req.body.priority || 'normal'}`);
        
        // إرسال إشعار Firebase لجميع الأجهزة
        const result = await sendNotificationToMultipleDevices(allDeviceTokens, {
          title: req.body.title || 'إشعار جديد',
          body: req.body.message || 'لديك إشعار جديد',
          notificationId: notification._id.toString(),
          type: req.body.type || 'general',
          priority: req.body.priority || 'normal',
          metadata: metadata
        });
        
        console.log(`✅ Firebase notifications sent to ${allDeviceTokens.length} devices`);
        console.log(`📬 Firebase Response:`, result);
      } else {
        console.log('⚠️  No device tokens found for customers');
        console.log('💡 Make sure customers have registered their FCM tokens via /fcm-token endpoint');
      }
    } catch (error) {
      console.error('❌ Firebase notification error:', error.message);
      // لا نفشل العملية إذا فشل إرسال Firebase
    }
  } 
  // إرسال للعملاء المحددين
  else if (req.body.recipients === 'specific' && req.body.specificCustomers && req.body.specificCustomers.length > 0) {
    try {
      console.log(`📤 Sending Firebase notifications to ${req.body.specificCustomers.length} specific customers`);
      
      const specificCustomers = await Customer.find({
        _id: { $in: req.body.specificCustomers }
      });

      for (const customer of specificCustomers) {
        if (customer.deviceTokens && customer.deviceTokens.length > 0) {
          await sendNotificationToCustomer(customer._id.toString(), {
            title: req.body.title || 'إشعار جديد',
            body: req.body.message || 'لديك إشعار جديد',
            notificationId: notification._id.toString(),
            type: req.body.type || 'general',
            priority: req.body.priority || 'normal',
            metadata: metadata
          });
        }
      }
      
      console.log(`✅ Firebase notifications sent to specific customers`);
    } catch (error) {
      console.error('❌ Firebase notification error:', error.message);
    }
  }
  // إرسال لجميع العملاء
  else if (req.body.recipients === 'all') {
    try {
      console.log('📤 Sending Firebase notifications to ALL customers');
      
      const allCustomers = await Customer.find({ isActive: true });
      const allDeviceTokens = [];
      
      allCustomers.forEach(customer => {
        if (customer.deviceTokens && customer.deviceTokens.length > 0) {
          allDeviceTokens.push(...customer.deviceTokens);
        }
      });

      if (allDeviceTokens.length > 0) {
        await sendNotificationToMultipleDevices(allDeviceTokens, {
          title: req.body.title || 'إشعار جديد',
          body: req.body.message || 'لديك إشعار جديد',
          notificationId: notification._id.toString(),
          type: req.body.type || 'general',
          priority: req.body.priority || 'normal',
          metadata: metadata
        });
        
        console.log(`✅ Firebase notifications sent to ${allDeviceTokens.length} devices`);
      }
    } catch (error) {
      console.error('❌ Firebase notification error:', error.message);
    }
  }

  sendSuccess(res, notification, 'Notification created successfully', 201);
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return sendNotFound(res, 'Notification');
  }

  await notification.markAsRead(req.user.id);

  sendSuccess(res, null, 'Notification marked as read');
});

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user.id);

  sendSuccess(res, { count }, 'Unread count fetched successfully');
});

// ===================== Customer API Endpoints (No Auth) =====================

// @desc    Get notifications for customer
// @route   GET /api/customer-api/notifications OR GET /api/customer-api/:customerId/notifications
// @access  Public (No auth - uses customerId from query or params)
const getCustomerNotifications = asyncHandler(async (req, res) => {
  // Support both query param and URL param
  const customerId = req.query.customerId || req.params.customerId;

  if (!customerId) {
    return sendError(res, 'Customer ID is required', 400);
  }

  // Get notifications for customers
  const query = Notification.find({
    $or: [
      { recipients: 'all' },
      { recipients: 'customers' },
      { specificCustomers: customerId }
    ],
    status: 'sent',
    isActive: true
  });

  const pagination = new Pagination(query, req.query)
    .filter()
    .search(['title', 'message'])
    .sort()
    .limitFields()
    .paginate();

  pagination.query = pagination.query.populate('createdBy', 'name');

  const result = await pagination.execute();

  sendSuccess(res, { notifications: result.docs }, 'Notifications fetched successfully', 200, { pagination: result.pagination });
});

// @desc    Get unread count for customer
// @route   GET /api/customer-api/notifications/unread-count OR GET /api/customer-api/:customerId/notifications/unread-count
// @access  Public (No auth)
const getCustomerUnreadCount = asyncHandler(async (req, res) => {
  // Support both query param and URL param
  const customerId = req.query.customerId || req.params.customerId;

  if (!customerId) {
    return sendError(res, 'Customer ID is required', 400);
  }

  const count = await Notification.countDocuments({
    $or: [
      { recipients: 'all' },
      { recipients: 'customers' },
      { specificCustomers: customerId }
    ],
    status: 'sent',
    isActive: true,
    'readBy.user': { $ne: customerId }
  });

  sendSuccess(res, { count }, 'Unread count fetched successfully');
});

// @desc    Mark notification as read for customer
// @route   PATCH /api/customer-api/notifications/:id/read OR PATCH /api/customer-api/:customerId/notifications/:id/read
// @access  Public (No auth)
const markAsReadForCustomer = asyncHandler(async (req, res) => {
  // Support both body and URL param
  const customerId = req.body.customerId || req.params.customerId;

  if (!customerId) {
    return sendError(res, 'Customer ID is required', 400);
  }

  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return sendNotFound(res, 'Notification');
  }

  await notification.markAsRead(customerId);

  sendSuccess(res, null, 'Notification marked as read');
});

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  getUnreadCount,
  getCustomerNotifications,
  getCustomerUnreadCount,
  markAsReadForCustomer
};