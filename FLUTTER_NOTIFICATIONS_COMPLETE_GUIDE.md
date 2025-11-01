# Firebase Push Notifications - Complete Flutter Setup
## إعداد كامل لإشعارات Firebase في Flutter

🔔 **لضمان ظهور الإشعارات حتى مع التطبيق المغلق (مثل WhatsApp)**

---

## 📱 الإعدادات المطلوبة

### 1. تحديث `pubspec.yaml`

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  
  # للإشعارات المحلية (Local Notifications)
  flutter_local_notifications: ^16.3.0
  
  # HTTP
  http: ^1.1.0
```

```bash
flutter pub get
```

---

## 🔧 إعداد Android

### 1. تحديث `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34  // أو أعلى
    
    defaultConfig {
        minSdkVersion 21  // مهم جداً!
        targetSdkVersion 34
        // ...
    }
}

dependencies {
    // تأكد من إضافة
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### 2. إنشاء `android/app/src/main/kotlin/.../Application.kt`

```kotlin
package com.yourcompany.yourapp

import io.flutter.app.FlutterApplication
import io.flutter.plugin.common.PluginRegistry
import io.flutter.plugins.firebase.messaging.FlutterFirebaseMessagingBackgroundService

class Application : FlutterApplication(), PluginRegistry.PluginRegistrantCallback {
    override fun onCreate() {
        super.onCreate()
        FlutterFirebaseMessagingBackgroundService.setPluginRegistrant(this)
    }

    override fun registerWith(registry: PluginRegistry) {
        // Register plugins here
    }
}
```

### 3. تحديث `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourcompany.yourapp">
    
    <!-- الأذونات المطلوبة -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

    <application
        android:name=".Application"
        android:label="Animal Vaccination"
        android:icon="@mipmap/ic_launcher">
        
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTop"
            android:showWhenLocked="true"
            android:turnScreenOn="true">
            
            <!-- مهم للتعامل مع الإشعارات -->
            <intent-filter>
                <action android:name="FLUTTER_NOTIFICATION_CLICK" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>

        <!-- خدمة Firebase Messaging -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

        <!-- Notification channel metadata -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="high_importance_channel" />
        
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
            
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
    </application>
</manifest>
```

### 4. إضافة الأيقونة `android/app/src/main/res/drawable/ic_notification.xml`

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorControlNormal">
    <path
        android:fillColor="@android:color/white"
        android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.89,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
```

---

## 📱 كود Flutter الكامل

### 1. إنشاء `lib/services/notification_service.dart`

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// معالج الإشعارات في الخلفية (خارج الكلاس)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('🔔 Background Message: ${message.notification?.title}');
  
  // عرض الإشعار المحلي
  await NotificationService.instance.showNotification(message);
}

class NotificationService {
  static final NotificationService instance = NotificationService._();
  NotificationService._();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  /// تهيئة خدمة الإشعارات
  Future<void> initialize() async {
    if (_initialized) return;

    // 1. طلب الأذونات
    await _requestPermissions();

    // 2. إعداد Local Notifications
    await _setupLocalNotifications();

    // 3. معالج الإشعارات في الخلفية
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 4. معالجة الإشعارات عندما يكون التطبيق مفتوح
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 5. معالجة النقر على الإشعار
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // 6. التحقق من الإشعار الذي فتح التطبيق
    RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageOpenedApp(initialMessage);
    }

    _initialized = true;
    print('✅ Notification Service initialized');
  }

  /// طلب أذونات الإشعارات
  Future<void> _requestPermissions() async {
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ User granted notification permission');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      print('⚠️  User granted provisional permission');
    } else {
      print('❌ User declined notification permission');
    }
  }

  /// إعداد Local Notifications
  Future<void> _setupLocalNotifications() async {
    // إعدادات Android
    const AndroidInitializationSettings androidSettings = 
        AndroidInitializationSettings('@drawable/ic_notification');

    // إعدادات iOS
    const DarwinInitializationSettings iosSettings = 
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // إنشاء قناة إشعارات عالية الأهمية (Android)
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'إشعارات مهمة',
      description: 'إشعارات الحجوزات والتطعيمات',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// معالجة الإشعارات عندما التطبيق مفتوح (Foreground)
  void _handleForegroundMessage(RemoteMessage message) {
    print('📩 Foreground Message: ${message.notification?.title}');
    
    // عرض الإشعار المحلي
    showNotification(message);
  }

  /// معالجة النقر على الإشعار
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('🔔 Notification tapped: ${message.notification?.title}');
    
    // الانتقال للصفحة المناسبة
    final data = message.data;
    
    if (data['bookingId'] != null) {
      // TODO: Navigate to booking details
      print('Navigate to booking: ${data['bookingId']}');
    } else if (data['notificationId'] != null) {
      // TODO: Navigate to notifications
      print('Navigate to notification: ${data['notificationId']}');
    }
  }

  /// معالجة النقر على الإشعار المحلي
  void _onNotificationTapped(NotificationResponse response) {
    print('🔔 Local notification tapped: ${response.payload}');
    
    if (response.payload != null) {
      final data = json.decode(response.payload!);
      
      if (data['bookingId'] != null) {
        // TODO: Navigate to booking
      }
    }
  }

  /// عرض الإشعار المحلي
  Future<void> showNotification(RemoteMessage message) async {
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'إشعارات مهمة',
            channelDescription: 'إشعارات الحجوزات والتطعيمات',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@drawable/ic_notification',
            color: const Color(0xFF2196F3),
            playSound: true,
            enableVibration: true,
            showWhen: true,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: json.encode(message.data),
      );
    }
  }

  /// الحصول على FCM Token
  Future<String?> getToken() async {
    try {
      String? token = await _firebaseMessaging.getToken();
      print('📱 FCM Token: $token');
      return token;
    } catch (e) {
      print('❌ Error getting FCM token: $e');
      return null;
    }
  }

  /// تسجيل FCM Token في السيرفر
  Future<bool> registerToken(String customerId) async {
    try {
      String? token = await getToken();
      if (token == null) return false;

      final response = await http.post(
        Uri.parse('http://your-server.com/api/customer-api/$customerId/fcm-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'fcmToken': token}),
      );

      if (response.statusCode == 200) {
        print('✅ FCM token registered successfully');
        
        // الاستماع لتحديثات Token
        _firebaseMessaging.onTokenRefresh.listen((newToken) {
          print('🔄 Token refreshed: $newToken');
          registerToken(customerId);
        });
        
        return true;
      }
      return false;
    } catch (e) {
      print('❌ Error registering token: $e');
      return false;
    }
  }

  /// إزالة FCM Token
  Future<bool> unregisterToken(String customerId) async {
    try {
      String? token = await getToken();
      if (token == null) return true;

      final response = await http.delete(
        Uri.parse('http://your-server.com/api/customer-api/$customerId/fcm-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'fcmToken': token}),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error unregistering token: $e');
      return false;
    }
  }
}
```

---

### 2. تحديث `lib/main.dart`

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تهيئة Firebase
  await Firebase.initializeApp();
  
  // تهيئة خدمة الإشعارات
  await NotificationService.instance.initialize();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Animal Vaccination',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: HomeScreen(),
    );
  }
}
```

---

### 3. استخدام في صفحة Login

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  Future<void> _login() async {
    try {
      // 1. تسجيل الدخول
      final response = await http.post(
        Uri.parse('http://your-server.com/api/customer-api/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'phone': phoneController.text,
          'password': passwordController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final customerId = data['data']['customer']['_id'];
        
        // 2. حفظ customerId
        await _saveCustomerId(customerId);
        
        // 3. تسجيل FCM Token
        bool tokenRegistered = await NotificationService.instance
            .registerToken(customerId);
        
        if (tokenRegistered) {
          print('✅ Ready to receive notifications');
        }
        
        // 4. الانتقال للصفحة الرئيسية
        Navigator.pushReplacementNamed(context, '/home');
      }
    } catch (e) {
      print('Login error: $e');
    }
  }
}
```

---

## 🧪 اختبار الإشعارات

### 1. تشغيل التطبيق
```bash
flutter run
```

### 2. تسجيل الدخول
سيتم إرسال FCM Token تلقائياً

### 3. إغلاق التطبيق تماماً
اضغط على زر الرجوع أو أغلق التطبيق

### 4. إرسال إشعار من لوحة التحكم
اذهب إلى صفحة الإشعارات وأرسل إشعار جديد

### 5. التحقق
يجب أن يظهر الإشعار في notification bar حتى مع التطبيق مغلق! 🔔

---

## 🔍 استكشاف الأخطاء

### المشكلة 1: الإشعار لا يظهر مع التطبيق مغلق

**الحل:**
```dart
// تأكد من إضافة في AndroidManifest.xml:
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

// وفي build.gradle:
minSdkVersion 21  // مهم جداً!
```

### المشكلة 2: الإشعار يظهر لكن بدون صوت

**الحل:**
```dart
// تأكد من إنشاء notification channel:
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'high_importance_channel',
  'إشعارات مهمة',
  importance: Importance.high,  // مهم!
  playSound: true,              // مهم!
);
```

### المشكلة 3: التطبيق لا يفتح عند النقر على الإشعار

**الحل:**
```dart
// تأكد من إضافة intent-filter في AndroidManifest.xml:
<intent-filter>
    <action android:name="FLUTTER_NOTIFICATION_CLICK" />
    <category android:name="android.intent.category.DEFAULT" />
</intent-filter>
```

---

## ✅ Checklist النهائي

- [ ] تثبيت firebase_messaging و flutter_local_notifications
- [ ] تحديث android/app/build.gradle (minSdkVersion 21)
- [ ] إضافة الأذونات في AndroidManifest.xml
- [ ] إنشاء Application.kt
- [ ] تحديث AndroidManifest مع Application class
- [ ] إضافة ic_notification.xml
- [ ] إنشاء NotificationService.dart
- [ ] تهيئة Firebase في main.dart
- [ ] تسجيل FCM Token عند Login
- [ ] اختبار مع التطبيق مفتوح ✅
- [ ] اختبار مع التطبيق في الخلفية ✅
- [ ] اختبار مع التطبيق مغلق تماماً ✅

---

**الآن الإشعارات تعمل مثل WhatsApp تماماً! 🎉**

سيظهر الإشعار:
- ✅ مع التطبيق مفتوح
- ✅ مع التطبيق في الخلفية  
- ✅ مع التطبيق مغلق تماماً
- ✅ مع الهاتف مقفل
