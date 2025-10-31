# 🔥 Firebase Push Notifications Setup Guide

## Overview
This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications in the Hassana Server project.

---

## 📋 Prerequisites

1. Google Cloud Project with Firebase enabled
2. Firebase Admin SDK service account key
3. Node.js and npm already installed

---

## 🚀 Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter project name: `findoctor` (or your preference)
4. Enable Google Analytics (optional)
5. Create project and wait for completion

### Step 2: Get Service Account Key

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Navigate to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file

### Step 3: Add Service Account Key to Backend

1. Copy the downloaded JSON file to:
   ```
   backend/config/findoctor-firebase-adminsdk.json
   ```

2. The file should contain:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "xxx",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com",
     "client_id": "xxx",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "xxx"
   }
   ```

### Step 4: Install Required Packages

The `firebase-admin` package is required. Install it:

```bash
npm install firebase-admin
```

### Step 5: Enable Cloud Messaging

1. In Firebase Console, go to **Cloud Messaging** tab
2. Note your **Server API Key** (you'll need this for client-side)
3. Enable Cloud Messaging API

---

## 📱 API Endpoints

### Save Device Token
**POST** `/api/customers/device-token/save`

```json
{
  "customerId": "customer_id_here",
  "deviceToken": "firebase_device_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": "xxx",
    "deviceTokenCount": 1,
    "message": "Device token saved successfully"
  }
}
```

### Remove Device Token
**POST** `/api/customers/device-token/remove`

```json
{
  "customerId": "customer_id_here",
  "deviceToken": "firebase_device_token"
}
```

---

## 🔔 Notification Features

### Automatic Notifications
Notifications are automatically sent when:

1. **Booking Created** ✅
   - Title: "✅ تم إنشاء الحجز"
   - Includes booking details

2. **Booking Confirmed** ✅
   - Title: "✅ تم تأكيد الحجز"
   - Shows branch and appointment details

3. **Booking Completed** 🎉
   - Title: "🎉 تم إكمال الحجز"
   - Confirmation message

4. **Booking Cancelled** ❌
   - Title: "❌ تم إلغاء الحجز"
   - Includes cancellation reason

### Available Notification Methods

#### 1. Send to Single Device
```javascript
const { sendNotificationToDevice } = require('../services/push-notification-service');

await sendNotificationToDevice(deviceToken, {
  title: 'تنبيه جديد',
  body: 'رسالة الإشعار',
  customData: 'value'
});
```

#### 2. Send to Multiple Devices
```javascript
const { sendNotificationToMultipleDevices } = require('../services/push-notification-service');

await sendNotificationToMultipleDevices([token1, token2], {
  title: 'تنبيه جماعي',
  body: 'رسالة للجميع'
});
```

#### 3. Send to Customer (All Devices)
```javascript
const { sendNotificationToCustomer } = require('../services/push-notification-service');

await sendNotificationToCustomer(customerId, {
  title: 'إشعار خاص',
  body: 'رسالة شخصية'
});
```

#### 4. Send to Topic
```javascript
const { sendNotificationToTopic } = require('../services/push-notification-service');

await sendNotificationToTopic('bookings', {
  title: 'إشعار الحجوزات',
  body: 'تحديث جديد'
});
```

---

## 💻 Usage Example - Flutter Client

### Get Device Token

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

Future<void> getAndSaveDeviceToken() async {
  String? token = await _firebaseMessaging.getToken();
  
  if (token != null) {
    // Save to backend
    await saveDeviceToken(customerId, token);
  }
}

Future<void> saveDeviceToken(String customerId, String token) async {
  final response = await http.post(
    Uri.parse('http://your-api.com/api/customers/device-token/save'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'customerId': customerId,
      'deviceToken': token,
    }),
  );
  
  if (response.statusCode == 200) {
    print('Device token saved successfully');
  }
}
```

### Handle Notifications

```dart
void setupNotificationListeners() {
  // Foreground notifications
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    if (message.notification != null) {
      print('Title: ${message.notification!.title}');
      print('Body: ${message.notification!.body}');
      
      // Show notification UI
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(message.notification!.title ?? ''),
          content: Text(message.notification!.body ?? ''),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
    }
  });

  // Background notifications (handled automatically)
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('Notification tapped: ${message.notification?.title}');
    // Navigate to booking details
  });
}
```

---

## 🛡️ Error Handling

If Firebase initialization fails, notifications won't be sent but the app will continue to work normally. Check logs for messages like:

```
❌ Firebase initialization failed: [error message]
```

To fix this:
1. Verify the JSON file is in the correct location
2. Ensure JSON file is valid
3. Check Firebase console permissions

---

## 📊 Monitoring

### Check Notifications in Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Look for notification delivery status
3. Review device token subscriptions

### Server Logs

The service logs all notification attempts:

```
✅ Notification sent successfully: [messageId]
❌ Failed to send notification: [error message]
```

---

## 🔐 Security

1. **Never commit** the service account JSON file to version control
2. Add to `.gitignore`:
   ```
   config/findoctor-firebase-adminsdk.json
   ```

3. Use environment variables in production:
   ```javascript
   // Instead of file path
   const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
   ```

---

## 🧪 Testing

### Test Notification Service

```bash
node test-notifications.js
```

### Manual Test
1. Save a device token via API
2. Create a new booking
3. Check device for notification

---

## 📝 Troubleshooting

| Issue | Solution |
|-------|----------|
| Firebase not initialized | Verify JSON file path and content |
| Notifications not received | Check device token is valid and saved |
| Invalid device token error | Regenerate token on client side |
| Message too large | Reduce data payload size |

---

## 🔗 Useful Resources

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Console](https://console.firebase.google.com/)

---

## ✅ Checklist

- [ ] Firebase project created
- [ ] Service account key downloaded
- [ ] JSON file placed in `config/` directory
- [ ] `firebase-admin` package installed
- [ ] Backend server restarted
- [ ] Device token endpoint tested
- [ ] Notifications received on device
- [ ] JSON file added to `.gitignore`

---

**Last Updated:** October 31, 2025
**Firebase Admin SDK Version:** 11.0+
