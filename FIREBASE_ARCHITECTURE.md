# 📱 Firebase Push Notifications - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE CONSOLE                         │
│                   (Cloud Messaging Service)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ API Key / Server API Key
                         │
         ┌───────────────┴────────────────┐
         │                                │
         │ (HTTPS)                        │ (Admin SDK)
         ▼                                ▼
    ┌─────────────┐         ┌──────────────────────────┐
    │  Flutter    │         │  BACKEND SERVER          │
    │  App (iOS)  │◄────────┤  (Node.js + Express)    │
    └─────────────┘         │                          │
                            │ Services:                │
    ┌─────────────┐         │ • push-notification..   │
    │  Flutter    │         │ • bookingController     │
    │  App (AND)  │◄────────┤ • customerController    │
    └─────────────┘         │                          │
                            │ Config:                  │
                            │ • Firebase JSON          │
                            └────────────┬─────────────┘
                                         │
                                         │ (MongoDB Driver)
                                         │
                                    ┌────▼─────────┐
                                    │  MONGODB     │
                                    │  DATABASE    │
                                    │              │
                                    │  Collections:│
                                    │  • customers │
                                    │    (tokens)  │
                                    │  • bookings  │
                                    └──────────────┘
```

---

## Data Flow Diagram

### 1. Device Token Registration Flow

```
┌──────────────────────────────────┐
│   App Starts / User Logs In      │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  Initialize Firebase Messaging   │
│  Get Device Token                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  POST /api/customers/device-     │
│  token/save                      │
│  {                               │
│    customerId: "xxx",            │
│    deviceToken: "fcm_token"      │
│  }                               │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  Backend Controller:             │
│  saveDeviceToken()               │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  MongoDB:                        │
│  Customer.deviceTokens.push()    │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  ✅ Token Saved Successfully     │
│  App Ready for Notifications     │
└──────────────────────────────────┘
```

### 2. Booking Creation with Notification

```
┌──────────────────────────────────┐
│  Doctor Creates Booking          │
│  POST /api/bookings              │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  bookingController.createBooking()│
│  1. Validate customer            │
│  2. Check time slot              │
│  3. Create booking               │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  TRY:                            │
│  sendNotificationToCustomer()    │
│  - Fetch customer tokens         │
│  - Prepare FCM message           │
│  - Send to Firebase              │
│  CATCH: Log & Continue           │
└────────────┬─────────────────────┘
             │
             ├─────────────┬──────────────┐
             │             │              │
             ▼             ▼              ▼
        ┌────────────┐ ┌──────────┐ ┌──────────┐
        │ Firebase   │ │ Firebase │ │ Firebase │
        │ (iPhone)   │ │ (Android)│ │ (Web)    │
        └────────────┘ └──────────┘ └──────────┘
             │             │              │
             └────────────┬┴──────────────┘
                          │
                    ┌─────▼──────┐
                    │  Devices   │
                    │  Receive   │
                    │ Notification
                    └────────────┘
```

### 3. Booking Status Update with Notification

```
┌────────────────────────────────────────┐
│  Doctor Updates Booking Status         │
│  PATCH /api/bookings/:id/status        │
│  { status: "confirmed" }               │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  updateBookingStatus():                │
│  1. Validate status transition         │
│  2. Update in MongoDB                  │
│  3. Populate notification fields       │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Check Status & Prepare Message:       │
│  - confirmed: "✅ تم تأكيد الحجز"      │
│  - completed: "🎉 تم إكمال الحجز"     │
│  - cancelled: "❌ تم إلغاء الحجز"      │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  sendNotificationToCustomer():         │
│  - Get all customer device tokens      │
│  - Build FCM message                   │
│  - Send to Firebase                    │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  ✅ Notification Sent                  │
│  📝 Logged in server                   │
│  ✅ Booking Status Updated             │
└────────────────────────────────────────┘
```

---

## File Structure

```
backend/
├── config/
│   └── findoctor-firebase-adminsdk.json  ← Add Firebase key here
│
├── src/
│   ├── controllers/
│   │   ├── bookingController.js          ✅ Updated
│   │   └── customerController.js         ✅ Updated
│   │
│   ├── models/
│   │   └── customer.js                   ✅ Updated (deviceTokens)
│   │
│   ├── routes/
│   │   ├── bookingRoutes.js
│   │   └── customerRoutes.js             ✅ Updated (token endpoints)
│   │
│   ├── services/
│   │   └── push-notification-service.js  ✅ Created
│   │
│   └── utils/
│       └── AppError.js
│
├── .gitignore                            ✅ Updated
├── package.json
└── FIREBASE_*.md                         ✅ Documentation
```

---

## Database Schema

### Customer Collection

```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  email: String,
  address: String,
  city: String,
  animals: [
    {
      name: String,
      type: String,
      count: Number,
      // ... other fields
    }
  ],
  deviceTokens: [                         // ✅ NEW FIELD
    "eHRxv_vvuZc:APA91bH...",
    "dYXR5_vvuXc:APA91bT..."
  ],
  isActive: Boolean,
  totalBookings: Number,
  lastBookingDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints Added

```
┌────────────────────────────────────────────────────────┐
│  Device Token Management                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│ POST /api/customers/device-token/save                 │
│ Save device token for customer                        │
│ Body: {customerId, deviceToken}                       │
│ Response: {customerId, deviceTokenCount}              │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ POST /api/customers/device-token/remove               │
│ Remove device token from customer                     │
│ Body: {customerId, deviceToken}                       │
│ Response: {customerId, deviceTokenCount}              │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Existing Endpoints (Now with Notifications)          │
├────────────────────────────────────────────────────────┤
│                                                        │
│ POST /api/bookings                                    │
│ Create booking (triggers notification) ✅             │
│                                                        │
│ PATCH /api/bookings/:id/status                        │
│ Update booking status (triggers notification) ✅      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Notification Message Format

```
┌──────────────────────────────────────────────────────┐
│           NOTIFICATION MESSAGE                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  NOTIFICATION (Display):                             │
│  ├─ title: "✅ تم تأكيد الحجز"                       │
│  └─ body: "تم تأكيد حجزك في الفرع الرئيسية"          │
│                                                      │
│  DATA (Custom):                                      │
│  ├─ bookingId: "507f1f77bcf86cd799439013"           │
│  ├─ status: "confirmed"                             │
│  ├─ appointmentDate: "2025-11-15"                   │
│  ├─ appointmentTime: "10:00"                        │
│  └─ timestamp: "2025-10-31T10:30:00.000Z"           │
│                                                      │
│  TARGET:                                             │
│  └─ token: "eHRxv_vvuZc:APA91bH..."                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Configuration Setup Flow

```
Step 1: Firebase Console
┌─────────────────────────────┐
│ Create Firebase Project     │
│ Enable Cloud Messaging      │
└────────────┬────────────────┘
             │
             ▼
Step 2: Generate Service Account
┌─────────────────────────────────────┐
│ Project Settings                    │
│ → Service Accounts                  │
│ → Generate New Private Key          │
│ → Download JSON                     │
└────────────┬────────────────────────┘
             │
             ▼
Step 3: Configure Backend
┌─────────────────────────────────────┐
│ Copy JSON to:                       │
│ config/findoctor-firebase-          │
│   adminsdk.json                     │
└────────────┬────────────────────────┘
             │
             ▼
Step 4: Install Package
┌─────────────────────────────────────┐
│ npm install firebase-admin          │
└────────────┬────────────────────────┘
             │
             ▼
Step 5: Restart Server
┌─────────────────────────────────────┐
│ npm run dev                         │
│ ✅ Firebase Initialized             │
└─────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌──────────────────────┐
│  Send Notification   │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │Firebase Init?│
    └───┬──────┬──┘
        │NO    │YES
        ▼      ▼
    ❌SKIP   ✅SEND
        │      │
        │      ▼
        │  ┌─────────────┐
        │  │Valid Token? │
        │  └───┬─────┬──┘
        │      │NO   │YES
        │      ▼     ▼
        │   ❌SKIP ✅SEND
        │      │     │
        │      │     ▼
        │      │  ┌────────────┐
        │      │  │Success?    │
        │      │  └─┬──────┬───┘
        │      │    │NO    │YES
        │      │    ▼      ▼
        │      │  ❌LOG   ✅LOG
        │      │    │      │
        └──────┴────┴──────┴──► Continue
                               (Don't Fail)
```

---

## Timeline

```
Oct 31, 2025  ✅ Implementation Complete

Components Delivered:
✅ Customer Model (deviceTokens field)
✅ Push Notification Service (6 functions)
✅ Controller Handlers (save/remove tokens)
✅ Route Endpoints (device token management)
✅ Auto-Notifications (4 booking events)
✅ Error Handling (graceful fallbacks)
✅ Security (config excluded from git)
✅ Documentation (4 guide files)
✅ Test Script (validation tool)

Status: Production Ready ✅
```

---

## Quick Reference

| Component | Location | Status |
|-----------|----------|--------|
| Service | `src/services/push-notification-service.js` | ✅ |
| Customer Schema | `src/models/customer.js` | ✅ |
| Booking Controller | `src/controllers/bookingController.js` | ✅ |
| Customer Controller | `src/controllers/customerController.js` | ✅ |
| Routes | `src/routes/customerRoutes.js` | ✅ |
| Firebase Config | `config/findoctor-firebase-adminsdk.json` | ⏳ (Add) |
| Documentation | `FIREBASE_*.md` | ✅ |
| Test Script | `test-firebase-notifications.js` | ✅ |

---

**Last Updated:** October 31, 2025
**Diagram Version:** 1.0
