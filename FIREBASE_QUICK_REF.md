# 🚀 Firebase Push Notifications - Quick Reference

## 📂 Files Added/Modified

| File | Status | Purpose |
|------|--------|---------|
| `src/services/push-notification-service.js` | ✅ Created | Firebase messaging service |
| `src/models/customer.js` | ✅ Modified | Added `deviceTokens` field |
| `src/controllers/customerController.js` | ✅ Modified | Added token save/remove functions |
| `src/controllers/bookingController.js` | ✅ Modified | Added notification sending |
| `src/routes/customerRoutes.js` | ✅ Modified | Added device token endpoints |
| `FIREBASE_SETUP.md` | ✅ Created | Setup instructions |
| `FIREBASE_IMPLEMENTATION.md` | ✅ Created | Implementation guide |
| `.gitignore` | ✅ Modified | Excluded Firebase config |

---

## 🔑 Key Endpoints

### Device Token Management
```
POST /api/customers/device-token/save
POST /api/customers/device-token/remove
```

### Booking Operations (Automatic Notifications)
```
POST /api/bookings
PATCH /api/bookings/:id/status
```

---

## 📦 Required Package

```bash
npm install firebase-admin
```

---

## 🔐 Configuration Required

**File Location:**
```
config/findoctor-firebase-adminsdk.json
```

**How to Get:**
1. Firebase Console → Project Settings
2. Service Accounts tab → Generate New Private Key
3. Save JSON to `config/findoctor-firebase-adminsdk.json`

---

## 🎯 Usage Examples

### Save Device Token (from client)
```javascript
const response = await fetch('http://api.local/api/customers/device-token/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: '507f1f77bcf86cd799439011',
    deviceToken: 'firebase_token_here'
  })
});
```

### Create Booking (auto-sends notification)
```javascript
const response = await fetch('http://api.local/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({
    customer: customerId,
    branch: branchId,
    animal: { type: 'cow', name: 'Bessie' },
    appointmentDate: '2025-11-15',
    appointmentTime: '10:00'
  })
});
```

### Confirm Booking (auto-sends notification)
```javascript
const response = await fetch(`http://api.local/api/bookings/${bookingId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({
    status: 'confirmed'
  })
});
```

---

## 🛠️ Custom Notifications

### Send to Single Customer
```javascript
const { sendNotificationToCustomer } = require('./services/push-notification-service');

await sendNotificationToCustomer(customerId, {
  title: 'إشعار مخصص',
  body: 'رسالة خاصة بك',
  bookingId: bookingId
});
```

### Send to Topic
```javascript
const { sendNotificationToTopic } = require('./services/push-notification-service');

await sendNotificationToTopic('announcements', {
  title: 'إعلان عام',
  body: 'رسالة موجهة للجميع'
});
```

---

## 📱 Flutter Integration

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  Future<void> init(String customerId) async {
    final token = await FirebaseMessaging.instance.getToken();
    
    // Save token to backend
    await http.post(
      Uri.parse('http://api.local/api/customers/device-token/save'),
      body: jsonEncode({
        'customerId': customerId,
        'deviceToken': token,
      }),
    );

    // Listen to notifications
    FirebaseMessaging.onMessage.listen((message) {
      print('Title: ${message.notification?.title}');
    });
  }
}
```

---

## 🔔 Automatic Notifications Sent

| Event | Title | Body |
|-------|-------|------|
| Booking Created | ✅ تم إنشاء الحجز | Booking details |
| Booking Confirmed | ✅ تم تأكيد الحجز | Branch + date/time |
| Booking Completed | 🎉 تم إكمال الحجز | Thank you message |
| Booking Cancelled | ❌ تم إلغاء الحجز | Reason |

---

## ✅ Next Steps

1. [ ] Download Firebase service account JSON
2. [ ] Place JSON in `config/findoctor-firebase-adminsdk.json`
3. [ ] Restart backend server
4. [ ] Test device token endpoint
5. [ ] Integrate Flutter client with FCM
6. [ ] Test notifications with real booking

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Firebase not initialized | Add JSON file to config/ |
| Notifications not received | Ensure device token is saved |
| Token validation error | Request new token on client |
| Message too large | Reduce data payload |

---

## 📚 Documentation

- Full Setup: `FIREBASE_SETUP.md`
- Implementation: `FIREBASE_IMPLEMENTATION.md`
- Code: `src/services/push-notification-service.js`

---

**Status:** ✅ Ready to Deploy
**Last Updated:** October 31, 2025
