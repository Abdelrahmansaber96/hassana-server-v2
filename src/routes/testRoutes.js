const express = require('express');
const router = express.Router();
const { sendNotificationToDevice } = require('../services/push-notification-service');

/**
 * @route   POST /api/test/send-notification
 * @desc    Test endpoint to send FCM notification
 * @access  Public (for testing only)
 */
router.post('/send-notification', async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;

    // Validation
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
        example: {
          fcmToken: 'your_device_token_here',
          title: 'Test Notification',
          body: 'This is a test message',
          data: { key1: 'value1', key2: 'value2' }
        }
      });
    }

    console.log('📤 Attempting to send test notification...');
    console.log('   Token:', fcmToken.substring(0, 20) + '...');
    console.log('   Title:', title || 'Test Title');
    console.log('   Body:', body || 'Test Body');

    // Send notification
    const result = await sendNotificationToDevice(fcmToken, {
      title: title || '🔔 Test Notification',
      body: body || 'This is a test notification from server',
      type: 'test',
      priority: 'high',
      ...(data || {})
    });

    if (result) {
      return res.status(200).json({
        success: true,
        message: '✅ Notification sent successfully!',
        data: {
          messageId: result,
          sentAt: new Date().toISOString(),
          token: fcmToken.substring(0, 20) + '...'
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: '❌ Failed to send notification',
        error: 'Firebase returned null response'
      });
    }
  } catch (error) {
    console.error('❌ Error in test notification:', error.message);
    console.error('   Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: '❌ Error sending notification',
      error: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/test/send-to-customer
 * @desc    Test sending notification to a customer by ID
 * @access  Public (for testing only)
 */
router.post('/send-to-customer', async (req, res) => {
  try {
    const { customerId, title, body } = req.body;
    const { sendNotificationToCustomer } = require('../services/push-notification-service');

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    console.log('📤 Sending notification to customer:', customerId);

    const result = await sendNotificationToCustomer(customerId, {
      title: title || '🔔 Test Notification',
      body: body || 'This is a test notification',
      type: 'test',
      customerId: customerId
    });

    if (result) {
      return res.status(200).json({
        success: true,
        message: '✅ Notification sent to customer',
        data: result
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or has no device tokens'
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/firebase-status
 * @desc    Check Firebase initialization status
 * @access  Public
 */
router.get('/firebase-status', (req, res) => {
  const { initializeFirebase } = require('../services/push-notification-service');
  
  try {
    // Try to get admin instance
    const admin = require('firebase-admin');
    const app = admin.app();
    
    return res.status(200).json({
      success: true,
      message: '✅ Firebase is initialized',
      data: {
        projectId: app.options.projectId || 'N/A',
        initialized: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '❌ Firebase is NOT initialized',
      error: error.message,
      help: 'Make sure findoctor-firebase-adminsdk.json is in src/config/ folder'
    });
  }
});

module.exports = router;
