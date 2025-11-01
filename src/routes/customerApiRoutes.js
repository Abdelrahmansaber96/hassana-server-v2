const express = require('express');
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  addAnimal,
  getMyAnimals,
  updateAnimal,
  deleteAnimal,
  getVaccinationsForAnimal,
  bookVaccination,
  getMyBookings,
  cancelBooking,
  createCustomerConsultation,
  getCustomerConsultations
} = require('../controllers/customerApiController');
const { 
  getCustomerNotifications, 
  getCustomerUnreadCount, 
  markAsReadForCustomer 
} = require('../controllers/notificationController');
const { validate } = require('../validators');
const {
  animalValidator,
  updateAnimalValidator,
  customerBookingValidator
} = require('../validators');

const router = express.Router();

// Public routes - No authentication required
// Authentication
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Notifications routes (support both formats)
// Format 1: /notifications?customerId=xxx
router.get('/notifications', getCustomerNotifications);
router.get('/notifications/unread-count', getCustomerUnreadCount);
router.patch('/notifications/:id/read', markAsReadForCustomer);

// Profile management
router.get('/profile/:customerId', getCustomerProfile);
router.put('/profile/:customerId', updateCustomerProfile);

// FCM Token management (for Firebase Push Notifications)
router.post('/:customerId/fcm-token', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const { fcmToken, deviceToken } = req.body;
    
    // قبول fcmToken أو deviceToken من التطبيق
    const token = fcmToken || deviceToken;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'FCM token is required' 
      });
    }

    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // إضافة token إذا لم يكن موجود
    if (!customer.deviceTokens.includes(token)) {
      customer.deviceTokens.push(token);
      await customer.save();
      console.log(`✅ FCM token registered for customer: ${customer.name}`);
    } else {
      console.log(`ℹ️  FCM token already exists for customer: ${customer.name}`);
    }

    res.json({ 
      success: true, 
      message: 'FCM token registered successfully',
      data: { 
        customerId: customer._id,
        deviceTokens: customer.deviceTokens 
      }
    });
  } catch (error) {
    console.error('❌ FCM token registration error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Remove FCM token (عند logout)
router.delete('/:customerId/fcm-token', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const { fcmToken, deviceToken } = req.body;
    
    const token = fcmToken || deviceToken;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'FCM token is required' 
      });
    }

    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // إزالة token
    const initialLength = customer.deviceTokens.length;
    customer.deviceTokens = customer.deviceTokens.filter(t => t !== token);
    await customer.save();
    
    if (customer.deviceTokens.length < initialLength) {
      console.log(`✅ FCM token removed for customer: ${customer.name}`);
    }

    res.json({ 
      success: true, 
      message: 'FCM token removed successfully',
      data: { 
        customerId: customer._id,
        deviceTokens: customer.deviceTokens 
      }
    });
  } catch (error) {
    console.error('❌ FCM token removal error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Legacy endpoint support (للتوافقية مع الكود القديم)
router.post('/:customerId/device-token', async (req, res) => {
  req.body.fcmToken = req.body.deviceToken;
  return router.handle(
    { ...req, url: req.url.replace('/device-token', '/fcm-token') }, 
    res
  );
});

router.delete('/:customerId/device-token', async (req, res) => {
  req.body.fcmToken = req.body.deviceToken;
  return router.handle(
    { ...req, url: req.url.replace('/device-token', '/fcm-token') }, 
    res
  );
});

// Animal management routes (using customerId)
router.post('/:customerId/animals', validate(animalValidator), addAnimal);
router.get('/:customerId/animals', getMyAnimals);
router.put('/:customerId/animals/:animalId', validate(updateAnimalValidator), updateAnimal);
router.delete('/:customerId/animals/:animalId', deleteAnimal);

// Vaccination routes
router.get('/:customerId/animals/:animalId/vaccinations', getVaccinationsForAnimal);

// Booking routes
router.post('/:customerId/bookings', validate(customerBookingValidator), bookVaccination);
router.post('/:customerId/bookings/confirm', validate(customerBookingValidator), bookVaccination); // alias لـ Flutter
router.get('/:customerId/bookings', getMyBookings);
router.put('/:customerId/bookings/:bookingId/cancel', cancelBooking);

// Consultation routes (No authentication required)
router.post('/consultations', createCustomerConsultation);
router.get('/consultations', getCustomerConsultations);

// Format 2: /:customerId/notifications (alternative format)
router.get('/:customerId/notifications', getCustomerNotifications);
router.get('/:customerId/notifications/unread-count', getCustomerUnreadCount);
router.patch('/:customerId/notifications/:id/read', markAsReadForCustomer);

module.exports = router;