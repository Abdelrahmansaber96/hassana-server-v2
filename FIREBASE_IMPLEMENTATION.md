# 📱 Firebase Push Notifications - Implementation Guide

## Overview
This document explains the implemented Firebase push notification system for the Hassana Server project.

---

## ✅ What's Been Implemented

### 1. **Customer Model Update** 
Added `deviceTokens` array field to store multiple device tokens per customer:
```javascript
deviceTokens: [{
  type: String,
  trim: true
}]
```

### 2. **Push Notification Service**
Created `/src/services/push-notification-service.js` with functions:

| Function | Purpose |
|----------|---------|
| `sendNotificationToDevice()` | Send to single device token |
| `sendNotificationToMultipleDevices()` | Send to array of tokens |
| `sendNotificationToCustomer()` | Send to all customer devices |
| `sendNotificationToTopic()` | Send to topic subscribers |
| `subscribeToTopic()` | Subscribe device to topic |
| `unsubscribeFromTopic()` | Unsubscribe device from topic |

### 3. **API Endpoints**

#### Save Device Token
```
POST /api/customers/device-token/save
Content-Type: application/json

{
  "customerId": "507f1f77bcf86cd799439011",
  "deviceToken": "eHRxv_vvuZc:APA91bH..."
}
```

Response:
```json
{
  "success": true,
  "data": {
    "customerId": "507f1f77bcf86cd799439011",
    "deviceTokenCount": 1,
    "message": "Device token saved successfully"
  }
}
```

#### Remove Device Token
```
POST /api/customers/device-token/remove
Content-Type: application/json

{
  "customerId": "507f1f77bcf86cd799439011",
  "deviceToken": "eHRxv_vvuZc:APA91bH..."
}
```

### 4. **Automatic Notifications**

#### Booking Created
- **When:** New booking created
- **Title:** ✅ تم إنشاء الحجز
- **Data:** Booking ID, status, appointment date/time

#### Booking Confirmed
- **When:** Booking status changed to `confirmed`
- **Title:** ✅ تم تأكيد الحجز
- **Data:** Branch name, appointment details

#### Booking Completed
- **When:** Booking status changed to `completed`
- **Title:** 🎉 تم إكمال الحجز
- **Message:** Thank you message

#### Booking Cancelled
- **When:** Booking status changed to `cancelled`
- **Title:** ❌ تم إلغاء الحجز
- **Data:** Cancellation reason (if provided)

---

## 🔧 Configuration

### Directory Structure
```
src/
├── config/
│   └── findoctor-firebase-adminsdk.json  ← Add your Firebase key here
├── controllers/
│   ├── bookingController.js  ✅ Updated
│   └── customerController.js  ✅ Updated
├── models/
│   └── customer.js  ✅ Updated
├── routes/
│   ├── bookingRoutes.js
│   └── customerRoutes.js  ✅ Updated
└── services/
    └── push-notification-service.js  ✅ Created
```

### Firebase Service Account Key
The system expects the Firebase service account JSON file at:
```
config/findoctor-firebase-adminsdk.json
```

**Steps to add:**
1. Download from Firebase Console → Project Settings → Service Accounts
2. Copy JSON file to `config/` folder
3. Rename to `findoctor-firebase-adminsdk.json`
4. Add to `.gitignore` ✅ (already done)

---

## 📲 Integration with Flutter Client

### Step 1: Get Device Token
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final String apiUrl = 'http://your-server.com/api';

  Future<void> initializeNotifications(String customerId) async {
    // Request permission
    await _firebaseMessaging.requestPermission();
    
    // Get device token
    String? token = await _firebaseMessaging.getToken();
    
    if (token != null) {
      // Save to backend
      await saveDeviceToken(customerId, token);
      
      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        saveDeviceToken(customerId, newToken);
      });
    }

    // Handle notifications
    setupMessageHandlers();
  }

  Future<void> saveDeviceToken(String customerId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/customers/device-token/save'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'customerId': customerId,
          'deviceToken': token,
        }),
      );

      if (response.statusCode == 200) {
        print('✅ Device token saved successfully');
      }
    } catch (e) {
      print('❌ Error saving device token: $e');
    }
  }

  void setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received foreground notification: ${message.notification?.title}');
      // Show notification in your app
    });

    // Background message handler
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

    // Notification tapped
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification tapped: ${message.notification?.title}');
      // Navigate to booking details
    });
  }
}

static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
  print('Handling background notification: ${message.notification?.title}');
}
```

### Step 2: Use in Your App
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final NotificationService _notificationService = NotificationService();

  @override
  void initState() {
    super.initState();
    // After user logs in, initialize notifications
    _initializeNotifications();
  }

  void _initializeNotifications() {
    String customerId = /* get from user auth */;
    _notificationService.initializeNotifications(customerId);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // Your app configuration
    );
  }
}
```

---

## 🧪 Testing

### Test 1: Save Device Token
```bash
curl -X POST http://localhost:5000/api/customers/device-token/save \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "507f1f77bcf86cd799439011",
    "deviceToken": "test-token-123"
  }'
```

### Test 2: Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer": "507f1f77bcf86cd799439011",
    "branch": "507f1f77bcf86cd799439012",
    "animal": {
      "type": "cow",
      "name": "Bessie"
    },
    "appointmentDate": "2025-11-15",
    "appointmentTime": "10:00"
  }'
```

### Test 3: Confirm Booking
```bash
curl -X PATCH http://localhost:5000/api/bookings/507f1f77bcf86cd799439013/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

---

## 🔄 Notification Flow

```
Customer Opens App
       ↓
Get Firebase Device Token
       ↓
Save to Backend: /api/customers/device-token/save
       ↓
Token Stored in DB: Customer.deviceTokens
       ↓
Doctor Creates/Updates Booking
       ↓
Backend Sends Notification via Firebase
       ↓
App Receives & Displays Notification
```

---

## 🛠️ Advanced Usage

### Send Notification Programmatically

```javascript
// In any controller or service
const { sendNotificationToCustomer } = require('../services/push-notification-service');

// Example: Send custom notification
await sendNotificationToCustomer(customerId, {
  title: 'تحديث جديد',
  body: 'رسالة مخصصة',
  customField: 'customValue'
});
```

### Subscribe to Topic (Bulk Notifications)

```javascript
const { subscribeToTopic } = require('../services/push-notification-service');

// Subscribe device to 'bookings' topic
await subscribeToTopic(deviceToken, 'bookings');

// Later, send to all subscribers
const { sendNotificationToTopic } = require('../services/push-notification-service');
await sendNotificationToTopic('bookings', {
  title: 'إعلان عام',
  body: 'رسالة موجهة لجميع العملاء'
});
```

---

## 🚨 Error Handling

### Firebase Not Initialized
If you see:
```
❌ Firebase initialization failed: ENOENT: no such file or directory
```

**Solution:**
1. Create `config/findoctor-firebase-adminsdk.json`
2. Add valid Firebase service account JSON
3. Restart server

### Invalid Device Token
If you see:
```
❌ Failed to send notification: Invalid registration token provided
```

**Solution:**
1. Device token expired or invalid
2. Client should request new token: `getToken()` in Firebase Messaging
3. Save new token to backend

### Message Too Long
If notification fails to send:
- Keep notification title < 100 characters
- Keep body < 200 characters
- Limit custom data fields

---

## 📊 Monitoring

### Check Device Tokens
```javascript
// In MongoDB
db.customers.find({ "deviceTokens": { $exists: true, $ne: [] } })
  .count()
```

### Check Server Logs
```
grep "Notification sent" app.log  // Successful sends
grep "Failed to send" app.log     // Failed sends
```

---

## 📝 Notification JSON Format

### What Backend Sends
```json
{
  "notification": {
    "title": "✅ تم تأكيد الحجز",
    "body": "تم تأكيد حجزك في الفرع الرئيسية"
  },
  "data": {
    "bookingId": "507f1f77bcf86cd799439013",
    "status": "confirmed",
    "appointmentDate": "2025-11-15",
    "appointmentTime": "10:00",
    "timestamp": "2025-10-31T10:30:00.000Z"
  },
  "token": "eHRxv_vvuZc:APA91bH..."
}
```

### What App Receives
**Foreground (App Open):**
```
RemoteMessage {
  notification: RemoteNotification {
    title: "✅ تم تأكيد الحجز",
    body: "تم تأكيد حجزك في الفرع الرئيسية"
  },
  data: {
    bookingId: "507f1f77bcf86cd799439013",
    // ... custom fields
  }
}
```

**Background (App Closed):**
- System notification appears
- User can tap to open app
- App receives notification via `onMessageOpenedApp`

---

## ✅ Checklist

- [ ] Firebase project created
- [ ] Service account JSON downloaded
- [ ] JSON file in `config/findoctor-firebase-adminsdk.json`
- [ ] `.gitignore` updated to exclude JSON file
- [ ] `firebase-admin` package installed
- [ ] Customer model updated with `deviceTokens`
- [ ] Push notification service created
- [ ] Controller functions updated
- [ ] API endpoints tested
- [ ] Flutter client integration completed
- [ ] Notifications tested with real device

---

## 📚 Related Files

- `src/services/push-notification-service.js` - Service implementation
- `src/controllers/bookingController.js` - Booking notifications
- `src/controllers/customerController.js` - Device token endpoints
- `src/models/customer.js` - Customer schema with tokens
- `FIREBASE_SETUP.md` - Setup instructions

---

**Last Updated:** October 31, 2025
**Status:** ✅ Ready for Production
