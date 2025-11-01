# Customer API Endpoints - FCM Integration
## نقاط النهاية لتطبيق العملاء - تكامل FCM

📱 **للتطبيق Flutter**

---

## 🔔 FCM Token Management

### 1. تسجيل FCM Token (Register Token)

```http
POST /api/customer-api/:customerId/fcm-token
Content-Type: application/json

{
  "fcmToken": "dXpL8r9Qr2k..."
}
```

**أو يمكن استخدام `deviceToken`:**
```json
{
  "deviceToken": "dXpL8r9Qr2k..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token registered successfully",
  "data": {
    "customerId": "507f1f77bcf86cd799439011",
    "deviceTokens": [
      "dXpL8r9Qr2k...",
      "aBcD1234XyZ..."
    ]
  }
}
```

**متى تستخدمه:**
- عند تسجيل الدخول
- عند تحديث FCM Token
- عند فتح التطبيق

---

### 2. إزالة FCM Token (Remove Token)

```http
DELETE /api/customer-api/:customerId/fcm-token
Content-Type: application/json

{
  "fcmToken": "dXpL8r9Qr2k..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token removed successfully",
  "data": {
    "customerId": "507f1f77bcf86cd799439011",
    "deviceTokens": []
  }
}
```

**متى تستخدمه:**
- عند تسجيل الخروج
- عند حذف الحساب

---

## 📅 Booking Endpoints

### إنشاء حجز (Create Booking)

**الطريقة 1 (المعتادة):**
```http
POST /api/customer-api/:customerId/bookings
Content-Type: application/json

{
  "branchId": "507f1f77bcf86cd799439011",
  "animalId": "507f1f77bcf86cd799439012",
  "appointmentDate": "2025-11-05",
  "appointmentTime": "10:00",
  "notes": "ملاحظات إضافية"
}
```

**الطريقة 2 (من Flutter):**
```http
POST /api/customer-api/:customerId/bookings/confirm
Content-Type: application/json

{
  "branchId": "507f1f77bcf86cd799439011",
  "animalId": "507f1f77bcf86cd799439012",
  "appointmentDate": "2025-11-05",
  "appointmentTime": "10:00",
  "notes": "ملاحظات إضافية"
}
```

**ملاحظة:** كلا الطريقتين تعمل بنفس الطريقة ✅

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "bookingNumber": "BK-2025-001",
    "customer": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "أحمد محمد"
    },
    "branch": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "فرع الرياض"
    },
    "appointmentDate": "2025-11-05T00:00:00.000Z",
    "appointmentTime": "10:00",
    "status": "pending"
  }
}
```

**ما يحدث تلقائياً:**
- ✅ يتم حفظ الحجز في قاعدة البيانات
- ✅ يتم إرسال إشعار Firebase للعميل
- ✅ يتم إرسال رسالة WhatsApp (إذا كان مفعل)

---

## 📱 كود Flutter للتكامل

### 1. تسجيل FCM Token

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'http://your-server.com/api';
  
  // تسجيل FCM Token
  static Future<bool> saveFcmToken(String customerId) async {
    try {
      // الحصول على FCM token
      String? fcmToken = await FirebaseMessaging.instance.getToken();
      
      if (fcmToken == null) {
        print('❌ FCM token is null');
        return false;
      }
      
      print('📱 FCM Token: $fcmToken');
      
      // إرسال للسيرفر
      final response = await http.post(
        Uri.parse('$baseUrl/customer-api/$customerId/fcm-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'fcmToken': fcmToken}),
      );
      
      if (response.statusCode == 200) {
        print('✅ FCM token registered successfully');
        return true;
      } else {
        print('❌ Failed to register FCM token: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Error saving FCM token: $e');
      return false;
    }
  }
  
  // إزالة FCM Token عند Logout
  static Future<bool> removeFcmToken(String customerId) async {
    try {
      String? fcmToken = await FirebaseMessaging.instance.getToken();
      
      if (fcmToken == null) return true;
      
      final response = await http.delete(
        Uri.parse('$baseUrl/customer-api/$customerId/fcm-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'fcmToken': fcmToken}),
      );
      
      if (response.statusCode == 200) {
        print('✅ FCM token removed successfully');
        return true;
      }
      return false;
    } catch (e) {
      print('❌ Error removing FCM token: $e');
      return false;
    }
  }
  
  // إنشاء حجز
  static Future<Map<String, dynamic>?> createBooking({
    required String customerId,
    required String branchId,
    required String animalId,
    required String appointmentDate,
    required String appointmentTime,
    String? notes,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/customer-api/$customerId/bookings/confirm'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'branchId': branchId,
          'animalId': animalId,
          'appointmentDate': appointmentDate,
          'appointmentTime': appointmentTime,
          'notes': notes,
        }),
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Booking created successfully');
        return data['data'];
      } else {
        print('❌ Failed to create booking: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Error creating booking: $e');
      return null;
    }
  }
}
```

---

### 2. استخدام في تسجيل الدخول

```dart
class AuthService {
  Future<void> login(String phone, String password) async {
    try {
      // 1. تسجيل الدخول
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/customer-api/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'phone': phone,
          'password': password,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final customerId = data['data']['customer']['_id'];
        
        // 2. حفظ customerId
        await _saveCustomerId(customerId);
        
        // 3. تسجيل FCM Token
        await ApiService.saveFcmToken(customerId);
        
        print('✅ Login successful');
      }
    } catch (e) {
      print('❌ Login error: $e');
    }
  }
  
  Future<void> logout() async {
    try {
      final customerId = await _getCustomerId();
      
      // 1. إزالة FCM Token
      await ApiService.removeFcmToken(customerId);
      
      // 2. مسح البيانات المحلية
      await _clearCustomerId();
      
      print('✅ Logout successful');
    } catch (e) {
      print('❌ Logout error: $e');
    }
  }
}
```

---

### 3. استخدام في إنشاء حجز

```dart
class BookingScreen extends StatelessWidget {
  Future<void> _createBooking() async {
    final customerId = await _getCustomerId();
    
    final booking = await ApiService.createBooking(
      customerId: customerId,
      branchId: selectedBranch.id,
      animalId: selectedAnimal.id,
      appointmentDate: '2025-11-05',
      appointmentTime: '10:00',
      notes: 'ملاحظات اختبارية',
    );
    
    if (booking != null) {
      // تم إنشاء الحجز بنجاح
      // سيصل إشعار Firebase تلقائياً!
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('✅ تم إنشاء الحجز بنجاح')),
      );
      
      // الانتقال لصفحة تفاصيل الحجز
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => BookingDetailsScreen(
            bookingId: booking['_id'],
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ فشل إنشاء الحجز')),
      );
    }
  }
}
```

---

## 🔄 تدفق العمل الكامل

```
1. المستخدم يفتح التطبيق
   ↓
2. يسجل الدخول بـ phone & password
   ↓
3. التطبيق يحصل على FCM Token من Firebase
   ↓
4. التطبيق يرسل Token للسيرفر عبر:
   POST /api/customer-api/:customerId/fcm-token
   ↓
5. السيرفر يحفظ Token في customer.deviceTokens[]
   ↓
6. المستخدم يقوم بعمل حجز:
   POST /api/customer-api/:customerId/bookings/confirm
   ↓
7. السيرفر:
   - يحفظ الحجز ✅
   - يرسل إشعار Firebase للـ FCM Token ✅
   ↓
8. الإشعار يظهر على الهاتف 🔔
   (حتى لو التطبيق مغلق!)
   ↓
9. عند تسجيل الخروج:
   DELETE /api/customer-api/:customerId/fcm-token
```

---

## 📊 أمثلة الاستخدام

### مثال 1: تسجيل الدخول وحفظ Token
```dart
// عند Login
String customerId = '507f1f77bcf86cd799439011';
bool success = await ApiService.saveFcmToken(customerId);

if (success) {
  print('✅ Ready to receive notifications');
}
```

### مثال 2: إنشاء حجز والحصول على إشعار
```dart
// إنشاء حجز
final booking = await ApiService.createBooking(
  customerId: customerId,
  branchId: branchId,
  animalId: animalId,
  appointmentDate: '2025-11-05',
  appointmentTime: '10:00',
);

// سيصل إشعار Firebase تلقائياً بعد ثواني
// 🔔 "✅ تم إنشاء الحجز - حجز جديد لـ الإبل"
```

### مثال 3: تسجيل الخروج وإزالة Token
```dart
// عند Logout
await ApiService.removeFcmToken(customerId);
await _clearLocalData();
```

---

## 🧪 اختبار الـ API

### باستخدام Postman:

#### 1. تسجيل FCM Token
```
POST http://localhost:3000/api/customer-api/507f1f77bcf86cd799439011/fcm-token
Content-Type: application/json

{
  "fcmToken": "test_token_12345"
}
```

#### 2. إنشاء حجز
```
POST http://localhost:3000/api/customer-api/507f1f77bcf86cd799439011/bookings/confirm
Content-Type: application/json

{
  "branchId": "507f1f77bcf86cd799439011",
  "animalId": "507f1f77bcf86cd799439012",
  "appointmentDate": "2025-11-05",
  "appointmentTime": "10:00"
}
```

#### 3. التحقق من السجلات
```bash
# في terminal السيرفر ستظهر:
✅ FCM token registered for customer: أحمد محمد
📤 Sending Firebase notification
✅ Notification sent successfully
```

---

## ✅ Checklist

- [ ] تثبيت firebase_messaging في Flutter
- [ ] تهيئة Firebase في main.dart
- [ ] طلب أذونات الإشعارات
- [ ] تنفيذ ApiService.saveFcmToken()
- [ ] استدعاء saveFcmToken عند Login
- [ ] تنفيذ ApiService.createBooking()
- [ ] استدعاء removeFcmToken عند Logout
- [ ] اختبار استلام الإشعارات
- [ ] اختبار مع التطبيق مغلق
- [ ] اختبار مع أجهزة متعددة

---

## 📝 ملاحظات مهمة

1. **الـ endpoints تدعم كلا الاسمين:**
   - `fcmToken` ✅ (الموصى به)
   - `deviceToken` ✅ (للتوافقية)

2. **الحجز يدعم كلا المسارين:**
   - `/bookings` ✅
   - `/bookings/confirm` ✅

3. **الإشعارات تُرسل تلقائياً:**
   - عند إنشاء حجز ✅
   - عند تحديث حجز ✅
   - من لوحة التحكم ✅

4. **أجهزة متعددة:**
   - يمكن للعميل تسجيل أكثر من token
   - الإشعارات تصل لجميع الأجهزة ✅

---

**جاهز للاستخدام! 🚀**

التطبيق الآن يمكنه إرسال FCM Token واستقبال الإشعارات!
