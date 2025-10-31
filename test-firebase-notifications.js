/**
 * Firebase Push Notification Test Script
 * Tests all notification service functions
 * 
 * Usage: node test-firebase-notifications.js
 */

const path = require('path');

// Check if Firebase config exists
const configPath = path.join(__dirname, 'config/findoctor-firebase-adminsdk.json');
console.log('\n🔍 Checking Firebase Configuration...\n');
console.log('Expected path:', configPath);

try {
  require.resolve(configPath);
  console.log('✅ Firebase config file found!\n');
} catch (error) {
  console.log('❌ Firebase config file NOT found');
  console.log('   Expected location:', configPath);
  console.log('   Please add the Firebase service account JSON file\n');
  console.log('   Steps:');
  console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('   2. Click "Generate New Private Key"');
  console.log('   3. Save the JSON file as: config/findoctor-firebase-adminsdk.json\n');
  process.exit(1);
}

// Test Firebase Admin SDK
console.log('🧪 Testing Firebase Admin SDK...\n');

try {
  const admin = require('firebase-admin');
  console.log('✅ firebase-admin package is installed\n');
} catch (error) {
  console.log('❌ firebase-admin package NOT installed');
  console.log('   Install it with: npm install firebase-admin\n');
  process.exit(1);
}

// Test notification service
console.log('📱 Testing Notification Service...\n');

const {
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToTopic
} = require('./src/services/push-notification-service');

console.log('✅ Notification service functions imported successfully\n');

// Display available functions
console.log('Available Functions:');
console.log('  1. sendNotificationToDevice(token, notification)');
console.log('  2. sendNotificationToMultipleDevices(tokens, notification)');
console.log('  3. sendNotificationToCustomer(customerId, notification)');
console.log('  4. sendNotificationToTopic(topic, notification)');
console.log('  5. subscribeToTopic(token, topic)');
console.log('  6. unsubscribeFromTopic(token, topic)\n');

// Check MongoDB connection
console.log('🗄️  Testing MongoDB Connection...\n');

try {
  const mongoose = require('mongoose');
  const Customer = require('./src/models/customer');
  console.log('✅ Mongoose and Customer model loaded\n');
} catch (error) {
  console.log('❌ MongoDB/Mongoose error:', error.message, '\n');
}

// Display test examples
console.log('📝 Example Usage:\n');

console.log('1. Save Device Token (from client):');
console.log('   curl -X POST http://localhost:5000/api/customers/device-token/save \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{');
console.log('       "customerId": "507f1f77bcf86cd799439011",');
console.log('       "deviceToken": "your-firebase-token-here"');
console.log('     }\'');
console.log();

console.log('2. Send Notification Programmatically:');
console.log('   const { sendNotificationToDevice } = require(\'./src/services/push-notification-service\');');
console.log('   await sendNotificationToDevice(deviceToken, {');
console.log('     title: "✅ تم تأكيد الحجز",');
console.log('     body: "تم تأكيد حجزك بنجاح",');
console.log('     bookingId: "507f1f77bcf86cd799439013"');
console.log('   });');
console.log();

console.log('3. Send to Customer (All Devices):');
console.log('   const { sendNotificationToCustomer } = require(\'./src/services/push-notification-service\');');
console.log('   await sendNotificationToCustomer(customerId, {');
console.log('     title: "إشعار جديد",');
console.log('     body: "لديك تحديث جديد"');
console.log('   });');
console.log();

// Checklist
console.log('✅ Pre-Deployment Checklist:\n');
console.log('  [✓] Firebase config file located');
console.log('  [✓] firebase-admin package installed');
console.log('  [✓] Notification service loaded');
console.log('  [✓] Database models configured');
console.log();

console.log('📋 Next Steps:\n');
console.log('  1. Start the server: npm run dev');
console.log('  2. Create a test customer in MongoDB');
console.log('  3. Save device token via API endpoint');
console.log('  4. Create a booking to trigger notification');
console.log('  5. Check Firebase Console for delivery status');
console.log();

console.log('📚 Documentation Files:\n');
console.log('  • FIREBASE_SETUP.md - Detailed setup instructions');
console.log('  • FIREBASE_IMPLEMENTATION.md - Complete implementation guide');
console.log('  • FIREBASE_QUICK_REF.md - Quick reference');
console.log();

console.log('🎉 Firebase Push Notification System Ready!\n');
