# 🧪 دليل الاختبار العملي لإشعارات Firebase
## Firebase Push Notifications Testing Guide

📅 **تاريخ الإنشاء:** 2025-11-01

---

## ✅ ما تم إنجازه

### 1. مراجعة كاملة للكود
- ✅ تهيئة Firebase Admin SDK صحيحة
- ✅ رسائل Firebase تحتوي على `notification` و `data` و `android` و `apns`
- ✅ جميع قيم `data` محولة إلى `String` (مطلوب من Firebase)
- ✅ Priority مضبوط على `high` لـ Android و iOS
- ✅ Notification channel ID مضبوط: `high_importance_channel`
- ✅ Error handling محسّن مع طباعة تفصيلية

### 2. إضافة Test Endpoints
تم إنشاء 3 endpoints جديدة للاختبار:

1. **POST /api/test/send-notification** - إرسال إشعار لـ token واحد
2. **POST /api/test/send-to-customer** - إرسال إشعار لعميل بـ ID
3. **GET /api/test/firebase-status** - فحص حالة Firebase

---

## 🔧 الإعدادات المطلوبة

### 1. التأكد من وجود Firebase Config

```bash
# تحقق من وجود الملف:
ls src/config/findoctor-firebase-adminsdk.json

# إذا لم يكن موجود، ضعه في المسار الصحيح
```

### 2. تشغيل السيرفر

```powershell
# من جذر المشروع
npm start

# يجب أن ترى:
# ✅ Firebase Admin SDK initialized successfully
#    Using config from: findoctor-firebase-adminsdk.json
# 🚀 Server running on port 3000
```

---

## 🧪 الاختبارات العملية

### الاختبار 1: فحص حالة Firebase

```bash
# طريقة 1: من المتصفح
http://localhost:3000/api/test/firebase-status

# طريقة 2: من PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/test/firebase-status" -Method GET | ConvertTo-Json
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "✅ Firebase is initialized",
  "data": {
    "projectId": "findoctor-xxx",
    "initialized": true,
    "timestamp": "2025-11-01T..."
  }
}
```

---

### الاختبار 2: إرسال إشعار لـ Token محدد

#### الخطوة 1: احصل على FCM Token من Flutter

```dart
// في Flutter app
final token = await FirebaseMessaging.instance.getToken();
print('FCM Token: $token');
// انسخ الـ token
```

#### الخطوة 2: أرسل الإشعار من PowerShell

```powershell
$body = @{
    fcmToken = "YOUR_FCM_TOKEN_HERE"
    title = "🔔 اختبار الإشعار"
    body = "هذا إشعار تجريبي من السيرفر"
    data = @{
        type = "test"
        priority = "high"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/test/send-notification" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" | ConvertTo-Json
```

#### الخطوة 3: باستخدام cURL

```bash
curl -X POST http://localhost:3000/api/test/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "YOUR_FCM_TOKEN_HERE",
    "title": "🔔 اختبار الإشعار",
    "body": "هذا إشعار تجريبي من السيرفر",
    "data": {
      "type": "test",
      "priority": "high"
    }
  }'
```

#### الخطوة 4: باستخدام Postman

```
POST http://localhost:3000/api/test/send-notification

Headers:
  Content-Type: application/json

Body (JSON):
{
  "fcmToken": "dXpL8r9Qr2k:APA91bH...",
  "title": "🔔 اختبار الإشعار",
  "body": "هذا إشعار تجريبي من السيرفر",
  "data": {
    "type": "test",
    "bookingId": "123456",
    "customerId": "789"
  }
}
```

**النتيجة المتوقعة في Console:**
```
📤 Attempting to send test notification...
   Token: dXpL8r9Qr2k:APA91bH...
   Title: 🔔 اختبار الإشعار
   Body: هذا إشعار تجريبي من السيرفر
✅ Notification sent successfully: projects/findoctor-xxx/messages/0:1234567890
```

**النتيجة المتوقعة في Response:**
```json
{
  "success": true,
  "message": "✅ Notification sent successfully!",
  "data": {
    "messageId": "projects/findoctor-xxx/messages/0:1234567890",
    "sentAt": "2025-11-01T10:30:00.000Z",
    "token": "dXpL8r9Qr2k:APA91bH..."
  }
}
```

**النتيجة المتوقعة على الهاتف:**
- 🔔 **الإشعار يظهر في notification bar**
- ✅ **يعمل حتى مع التطبيق مغلق**
- ✅ **يصدر صوت واهتزاز**

---

### الاختبار 3: إرسال إشعار لعميل بـ ID

```powershell
$body = @{
    customerId = "507f1f77bcf86cd799439011"
    title = "📅 تذكير بالموعد"
    body = "لديك موعد غداً الساعة 10 صباحاً"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/test/send-to-customer" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" | ConvertTo-Json
```

---

## 🔍 استكشاف الأخطاء الشائعة

### خطأ 1: Firebase not initialized

```
❌ Firebase is NOT initialized
```

**الحل:**
```bash
# تأكد من وجود الملف
ls src/config/findoctor-firebase-adminsdk.json

# إذا كان موجود بامتداد مكرر
mv src/config/findoctor-firebase-adminsdk.json.json src/config/findoctor-firebase-adminsdk.json

# أعد تشغيل السيرفر
npm start
```

---

### خطأ 2: Invalid FCM Token

```
❌ Error sending notification: Requested entity was not found.
Code: messaging/registration-token-not-found
```

**الأسباب:**
- الـ token غير صحيح
- الـ token انتهت صلاحيته
- التطبيق تم إلغاء تثبيته

**الحل:**
```dart
// احصل على token جديد من Flutter
final newToken = await FirebaseMessaging.instance.getToken();
print('New Token: $newToken');

// سجله في السيرفر
await http.post(
  Uri.parse('http://your-server/api/customer-api/$customerId/fcm-token'),
  body: json.encode({'fcmToken': newToken}),
);
```

---

### خطأ 3: Permission denied

```
❌ Error: Permission denied on resource project
```

**الحل:**
- تأكد أن `findoctor-firebase-adminsdk.json` هو ملف service account صحيح
- تأكد من تفعيل Firebase Cloud Messaging API في Firebase Console

---

### خطأ 4: الإشعار يظهر في Foreground فقط

**الحل:** تأكد من إعدادات Flutter:
```dart
// في AndroidManifest.xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

// في build.gradle
minSdkVersion 21
```

---

## 📊 سجلات النجاح

### سيرفر يعمل بشكل صحيح:

```
✅ Firebase Admin SDK initialized successfully
   Using config from: findoctor-firebase-adminsdk.json
📤 Attempting to send test notification...
   Token: dXpL8r9Qr2k...
   Title: 🔔 اختبار الإشعار
   Body: هذا إشعار تجريبي
✅ Notification sent successfully: projects/xxx/messages/0:1234567890
```

### Flutter App يستقبل بشكل صحيح:

```dart
// في Console
🔔 Background Message: 🔔 اختبار الإشعار
📩 Foreground Message: 🔔 اختبار الإشعار
```

---

## 🎯 سيناريو اختبار كامل

### الخطوة 1: تشغيل السيرفر
```powershell
cd "C:\Users\PC\Desktop\hassana server v2"
npm start
```

### الخطوة 2: فحص Firebase
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/test/firebase-status" -Method GET
```

### الخطوة 3: تشغيل Flutter App
```bash
flutter run
```

### الخطوة 4: الحصول على Token
```dart
// في Flutter - طباعة Token
final token = await FirebaseMessaging.instance.getToken();
print('📱 My Token: $token');
```

### الخطوة 5: إرسال إشعار اختبار
```powershell
# استبدل YOUR_TOKEN بالـ token من الخطوة 4
$body = @{
    fcmToken = "YOUR_TOKEN"
    title = "✅ نجح الاختبار!"
    body = "الإشعار وصل بنجاح"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/test/send-notification" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### الخطوة 6: التحقق
- ✅ افتح التطبيق → يجب أن يظهر الإشعار داخل التطبيق
- ✅ اضغط Home → يجب أن يظهر في notification bar
- ✅ أغلق التطبيق → أرسل إشعار آخر → يجب أن يظهر!

---

## 📝 أوامر سريعة

### تشغيل السيرفر
```powershell
npm start
```

### فحص Firebase
```powershell
curl http://localhost:3000/api/test/firebase-status
```

### إرسال إشعار (استبدل TOKEN)
```powershell
$token = "YOUR_FCM_TOKEN_HERE"
$body = @{
    fcmToken = $token
    title = "Test"
    body = "Hello from server!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/test/send-notification" -Method POST -Body $body -ContentType "application/json"
```

---

## ✅ Checklist النهائي

- [ ] Firebase config موجود في `src/config/`
- [ ] السيرفر يعمل بدون أخطاء
- [ ] `/api/test/firebase-status` يرجع success
- [ ] Flutter app يطبع FCM token
- [ ] Token مسجل في السيرفر عبر `/fcm-token`
- [ ] إرسال إشعار اختبار ناجح
- [ ] الإشعار يظهر مع التطبيق مفتوح
- [ ] الإشعار يظهر مع التطبيق في الخلفية
- [ ] الإشعار يظهر مع التطبيق مغلق ✅

---

## 🎉 النتيجة النهائية

**إذا نجحت جميع الاختبارات:**

✅ السيرفر يرسل إشعارات Firebase بشكل صحيح  
✅ الإشعارات تظهر حتى مع التطبيق مغلق  
✅ النظام جاهز للإنتاج!

**الآن يمكنك:**
- إرسال إشعارات من لوحة التحكم
- إرسال إشعارات عند الحجز
- إرسال إشعارات للعملاء المحددين
- جميع الإشعارات تعمل مثل WhatsApp تماماً! 🚀

---

**تاريخ التحديث:** 2025-11-01  
**الإصدار:** 1.0 - Production Ready
