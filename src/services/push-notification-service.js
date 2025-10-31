const admin = require('firebase-admin');
const path = require('path');
const { asyncHandler } = require('../utils/AppError');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // Load Firebase service account key
    const serviceAccountPath = path.join(
      __dirname,
      '../../config/findoctor-firebase-adminsdk.json'
    );

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('Note: Push notifications will not work until Firebase config is added');
  }
};

// Initialize Firebase on service load
initializeFirebase();

/**
 * Send push notification to a single device
 * @param {string} deviceToken - FCM device token
 * @param {object} notification - Notification payload
 * @returns {Promise}
 */
const sendNotificationToDevice = asyncHandler(async (deviceToken, notification) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping notification');
    return null;
  }

  if (!deviceToken) {
    console.warn('No device token provided');
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title || 'إشعار جديد',
        body: notification.body || 'لديك إشعار جديد',
      },
      data: {
        ...notification,
        timestamp: new Date().toISOString()
      },
      token: deviceToken
    };

    // Remove non-data fields from data payload
    delete message.data.title;
    delete message.data.body;

    const response = await admin.messaging().send(message);

    console.log('✅ Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send notification:', error.message);
    throw error;
  }
});

/**
 * Send push notification to multiple devices
 * @param {array} deviceTokens - Array of FCM device tokens
 * @param {object} notification - Notification payload
 * @returns {Promise}
 */
const sendNotificationToMultipleDevices = asyncHandler(
  async (deviceTokens, notification) => {
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized, skipping notification');
      return null;
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      console.warn('No device tokens provided');
      return null;
    }

    try {
      const message = {
        notification: {
          title: notification.title || 'إشعار جديد',
          body: notification.body || 'لديك إشعار جديد',
        },
        data: {
          ...notification,
          timestamp: new Date().toISOString()
        },
        tokens: deviceTokens
      };

      // Remove non-data fields from data payload
      delete message.data.title;
      delete message.data.body;

      const response = await admin.messaging().sendMulticast(message);

      console.log('✅ Notifications sent successfully:', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      // Log failed tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${idx}:`, resp.error);
          }
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to send multiple notifications:', error.message);
      throw error;
    }
  }
);

/**
 * Send notification to customer by ID
 * @param {string} customerId - Customer ID
 * @param {object} notification - Notification payload
 * @returns {Promise}
 */
const sendNotificationToCustomer = asyncHandler(async (customerId, notification) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping notification');
    return null;
  }

  try {
    const Customer = require('../models/customer');
    const customer = await Customer.findById(customerId);

    if (!customer || !customer.deviceTokens || customer.deviceTokens.length === 0) {
      console.warn(`Customer ${customerId} has no device tokens`);
      return null;
    }

    // Send to all customer's devices
    if (customer.deviceTokens.length === 1) {
      return await sendNotificationToDevice(customer.deviceTokens[0], notification);
    } else {
      return await sendNotificationToMultipleDevices(customer.deviceTokens, notification);
    }
  } catch (error) {
    console.error('❌ Failed to send notification to customer:', error.message);
    throw error;
  }
});

/**
 * Send notification to topic (subscription-based)
 * @param {string} topic - Topic name
 * @param {object} notification - Notification payload
 * @returns {Promise}
 */
const sendNotificationToTopic = asyncHandler(async (topic, notification) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping notification');
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title || 'إشعار جديد',
        body: notification.body || 'لديك إشعار جديد',
      },
      data: {
        ...notification,
        timestamp: new Date().toISOString()
      },
      topic
    };

    // Remove non-data fields from data payload
    delete message.data.title;
    delete message.data.body;

    const response = await admin.messaging().send(message);

    console.log('✅ Topic notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send topic notification:', error.message);
    throw error;
  }
});

/**
 * Subscribe device to topic
 * @param {string} deviceToken - FCM device token
 * @param {string} topic - Topic name
 * @returns {Promise}
 */
const subscribeToTopic = asyncHandler(async (deviceToken, topic) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping subscription');
    return null;
  }

  try {
    const response = await admin.messaging().subscribeToTopic([deviceToken], topic);
    console.log(`✅ Device subscribed to topic "${topic}"`);
    return response;
  } catch (error) {
    console.error('❌ Failed to subscribe to topic:', error.message);
    throw error;
  }
});

/**
 * Unsubscribe device from topic
 * @param {string} deviceToken - FCM device token
 * @param {string} topic - Topic name
 * @returns {Promise}
 */
const unsubscribeFromTopic = asyncHandler(async (deviceToken, topic) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping unsubscription');
    return null;
  }

  try {
    const response = await admin.messaging().unsubscribeFromTopic([deviceToken], topic);
    console.log(`✅ Device unsubscribed from topic "${topic}"`);
    return response;
  } catch (error) {
    console.error('❌ Failed to unsubscribe from topic:', error.message);
    throw error;
  }
});

module.exports = {
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToCustomer,
  sendNotificationToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
  initializeFirebase
};
