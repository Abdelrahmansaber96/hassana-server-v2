# Flutter Integration Guide - Firebase Push Notifications
## دليل تكامل Flutter مع إشعارات Firebase

📱 **للمطور Flutter Developer**

---

## 🚀 الخطوات السريعة / Quick Steps

### 1. إضافة Dependencies في pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  
  # HTTP requests
  http: ^1.1.0
```

ثم نفذ:
```bash
flutter pub get
```

---

### 2. تهيئة Firebase في main.dart

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// معالج الإشعارات في الخلفية (خارج main)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('🔔 Background Message: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تهيئة Firebase
  await Firebase.initializeApp();
  
  // معالج الإشعارات في الخلفية
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}
```

---

### 3. طلب أذونات الإشعارات

```dart
class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  @override
  void initState() {
    super.initState();
    _setupFirebaseMessaging();
  }

  Future<void> _setupFirebaseMessaging() async {
    // 1. طلب الأذونات
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ User granted permission');
      
      // 2. الحصول على Device Token
      String? token = await _firebaseMessaging.getToken();
      print('📱 Device Token: $token');
      
      // 3. إرسال Token للسيرفر (بعد تسجيل الدخول)
      if (token != null) {
        await _registerDeviceToken(token);
      }
      
      // 4. الاستماع لتحديثات Token
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 Token Refreshed: $newToken');
        _registerDeviceToken(newToken);
      });
      
      // 5. معالجة الإشعارات عند فتح التطبيق
      _setupMessageHandlers();
    } else {
      print('❌ User declined permission');
    }
  }

  // إرسال Token للسيرفر
  Future<void> _registerDeviceToken(String token) async {
    try {
      final customerId = 'YOUR_CUSTOMER_ID'; // من تسجيل الدخول
      
      final response = await http.post(
        Uri.parse('http://your-server.com/api/customer-api/$customerId/device-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'deviceToken': token}),
      );

      if (response.statusCode == 200) {
        print('✅ Device token registered successfully');
      }
    } catch (e) {
      print('❌ Failed to register device token: $e');
    }
  }

  // معالجة الإشعارات
  void _setupMessageHandlers() {
    // عندما يكون التطبيق مفتوح (Foreground)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📩 Foreground Message: ${message.notification?.title}');
      
      // عرض dialog أو snackbar
      if (message.notification != null) {
        _showNotificationDialog(
          message.notification!.title ?? 'إشعار',
          message.notification!.body ?? '',
        );
      }
    });

    // عندما يضغط المستخدم على الإشعار
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('🔔 Notification Opened: ${message.notification?.title}');
      
      // الانتقال للصفحة المناسبة
      if (message.data['bookingId'] != null) {
        // افتح صفحة الحجز
        Navigator.pushNamed(context, '/booking', 
          arguments: message.data['bookingId']
        );
      }
    });
  }

  void _showNotificationDialog(String title, String body) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('حسناً'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Animal Vaccination',
      home: HomeScreen(),
    );
  }
}
```

---

### 4. إرسال Token عند تسجيل الدخول

```dart
// في صفحة Login
Future<void> login(String phone, String password) async {
  try {
    // 1. تسجيل الدخول
    final loginResponse = await http.post(
      Uri.parse('http://your-server.com/api/customer-api/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'phone': phone,
        'password': password,
      }),
    );

    if (loginResponse.statusCode == 200) {
      final data = json.decode(loginResponse.body);
      final customerId = data['data']['customer']['_id'];
      
      // 2. حفظ customerId
      await _saveCustomerId(customerId);
      
      // 3. إرسال Device Token
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _registerDeviceToken(customerId, token);
      }
      
      // 4. الانتقال للصفحة الرئيسية
      Navigator.pushReplacementNamed(context, '/home');
    }
  } catch (e) {
    print('Login error: $e');
  }
}

Future<void> _registerDeviceToken(String customerId, String token) async {
  await http.post(
    Uri.parse('http://your-server.com/api/customer-api/$customerId/device-token'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({'deviceToken': token}),
  );
}
```

---

### 5. إزالة Token عند تسجيل الخروج

```dart
Future<void> logout() async {
  try {
    final customerId = await _getCustomerId();
    final token = await FirebaseMessaging.instance.getToken();
    
    if (token != null) {
      // إزالة Device Token من السيرفر
      await http.delete(
        Uri.parse('http://your-server.com/api/customer-api/$customerId/device-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'deviceToken': token}),
      );
    }
    
    // مسح البيانات المحلية
    await _clearCustomerId();
    
    // الانتقال لصفحة Login
    Navigator.pushReplacementNamed(context, '/login');
  } catch (e) {
    print('Logout error: $e');
  }
}
```

---

## 📊 هيكل البيانات / Data Structure

### إشعار من السيرفر يصل بهذا الشكل:

```json
{
  "notification": {
    "title": "✅ تم إنشاء الحجز",
    "body": "حجز جديد لـ الإبل"
  },
  "data": {
    "bookingId": "507f1f77bcf86cd799439011",
    "status": "pending",
    "appointmentDate": "2025-11-05",
    "appointmentTime": "10:00",
    "type": "booking",
    "priority": "high"
  }
}
```

### كيفية قراءة البيانات:

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  // العنوان والنص
  String title = message.notification?.title ?? '';
  String body = message.notification?.body ?? '';
  
  // البيانات الإضافية
  Map<String, dynamic> data = message.data;
  String bookingId = data['bookingId'] ?? '';
  String type = data['type'] ?? '';
  String priority = data['priority'] ?? '';
  
  print('Title: $title');
  print('Body: $body');
  print('Booking ID: $bookingId');
});
```

---

## 🧪 كيفية الاختبار / Testing

### 1. تشغيل التطبيق والحصول على Token
```dart
// في Console سيظهر:
📱 Device Token: dXpL8r9...
✅ Device token registered successfully
```

### 2. إرسال إشعار تجريبي من Postman

```bash
POST http://localhost:3000/api/notifications
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "title": "اختبار Firebase",
  "message": "هذا إشعار تجريبي للعميل",
  "recipients": "specific",
  "specificCustomers": ["YOUR_CUSTOMER_ID"],
  "type": "test",
  "priority": "high"
}
```

### 3. التحقق من الاستلام

#### أ. التطبيق مفتوح (Foreground):
```
📩 Foreground Message: اختبار Firebase
```
→ يظهر Dialog أو Snackbar

#### ب. التطبيق في الخلفية (Background):
→ يظهر في Notification Bar

#### ج. التطبيق مغلق (Terminated):
→ يظهر في Notification Bar

---

## 🔔 أنواع الإشعارات / Notification Types

### 1. إشعار الحجز (Booking)
```dart
if (data['type'] == 'booking') {
  Navigator.pushNamed(
    context, 
    '/booking-details',
    arguments: data['bookingId']
  );
}
```

### 2. إشعار التذكير (Reminder)
```dart
if (data['type'] == 'reminder') {
  // عرض تذكير
  _showReminderDialog(title, body);
}
```

### 3. إشعار العروض (Promotion)
```dart
if (data['type'] == 'promotion') {
  Navigator.pushNamed(context, '/offers');
}
```

### 4. إشعار عام (General)
```dart
if (data['type'] == 'general') {
  // عرض في صفحة الإشعارات
  Navigator.pushNamed(context, '/notifications');
}
```

---

## 🛠️ استكشاف الأخطاء / Troubleshooting

### المشكلة: لا يظهر الإشعار على Android
**الحل:**
```dart
// تأكد من إضافة في AndroidManifest.xml:
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### المشكلة: Token يساوي null
**الحل:**
```dart
// تأكد من تهيئة Firebase قبل طلب Token
await Firebase.initializeApp();
String? token = await FirebaseMessaging.instance.getToken();
```

### المشكلة: الإشعار لا يظهر والتطبيق مغلق
**الحل:**
```dart
// تأكد من إضافة Background Handler:
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
```

---

## 📝 ملاحظات مهمة / Important Notes

1. **Token قد يتغير** - استخدم `onTokenRefresh` لتحديثه
2. **iOS يحتاج APNs** - تأكد من إعداد Apple Push Notification service
3. **الأذونات مهمة** - اطلبها في الوقت المناسب
4. **اختبر على جهاز حقيقي** - المحاكي قد لا يدعم الإشعارات
5. **Android 13+** يحتاج permission في runtime

---

## ✅ Checklist

- [ ] تثبيت firebase_core و firebase_messaging
- [ ] تهيئة Firebase في main.dart
- [ ] طلب أذونات الإشعارات
- [ ] الحصول على Device Token
- [ ] إرسال Token للسيرفر عند Login
- [ ] معالجة الإشعارات (Foreground/Background/Terminated)
- [ ] إزالة Token عند Logout
- [ ] الاستماع لـ onTokenRefresh
- [ ] اختبار على جهاز حقيقي
- [ ] معالجة Navigation عند الضغط على الإشعار

---

**بالتوفيق! 🚀**

إذا واجهت أي مشكلة، راجع:
- [Firebase Flutter Documentation](https://firebase.flutter.dev/docs/messaging/overview)
- [FlutterFire GitHub](https://github.com/firebase/flutterfire)
