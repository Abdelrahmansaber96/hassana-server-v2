# 🚀 دليل نشر Firebase على السيرفر
## Firebase Deployment Guide for Production

---

## 🔐 المشكلة

ملف Firebase Service Account (`hassanaserver-firebase-adminsdk-*.json`) **محمي في .gitignore** ولن يُرفع إلى GitHub.

عند نشر التطبيق على السيرفر، يجب وضع هذا الملف يدوياً.

---

## ✅ الحلول المتاحة

### **الحل 1: نسخ الملف يدوياً (الأسهل)** ⭐

#### **الخطوات:**

**1. على جهازك المحلي:**
```bash
# الملف موجود في:
src/config/hassanaserver-firebase-adminsdk-*.json
```

**2. على السيرفر:**

**أ) عبر FTP/SFTP (FileZilla, WinSCP):**
- اتصل بالسيرفر
- انتقل إلى: `/path/to/your/app/src/config/`
- ارفع الملف يدوياً

**ب) عبر SCP Command:**
```bash
# من جهازك المحلي
scp src/config/hassanaserver-firebase-adminsdk-*.json user@your-server:/path/to/app/src/config/
```

**ج) عبر SSH مباشرة:**
```bash
# اتصل بالسيرفر
ssh user@your-server

# أنشئ المجلد إذا لم يكن موجود
mkdir -p /path/to/app/src/config

# انسخ محتوى الملف (من جهازك المحلي)
nano /path/to/app/src/config/hassanaserver-firebase-adminsdk.json
# الصق المحتوى واحفظ
```

**3. أعد تشغيل التطبيق:**
```bash
pm2 restart hassana-server
# أو
npm start
```

**4. تحقق من النجاح:**
```bash
# يجب أن ترى في logs:
# ✅ Firebase Admin SDK initialized successfully
#    Using config from: hassanaserver-firebase-adminsdk-*.json
```

---

### **الحل 2: استخدام Environment Variable (الأفضل للإنتاج)** 🔒

#### **المميزات:**
- ✅ أكثر أماناً
- ✅ لا حاجة لرفع ملفات
- ✅ سهل التحديث بدون إعادة نشر

#### **الخطوات:**

**1. على جهازك المحلي:**
```bash
# اقرأ محتوى الملف بدون مسافات
cat src/config/hassanaserver-firebase-adminsdk-*.json | tr -d '\n'
```

**النتيجة:** سطر واحد JSON:
```json
{"type":"service_account","project_id":"hassanaserver","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**2. على السيرفر، أضف إلى `.env`:**
```bash
# افتح ملف .env
nano /path/to/app/.env

# أضف السطر التالي (الصق JSON كامل):
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"hassanaserver",...}'
```

**⚠️ ملاحظة:** 
- ضع JSON داخل **single quotes** `'...'`
- تأكد أن السطر في سطر واحد بدون Enter

**3. أعد تشغيل التطبيق:**
```bash
pm2 restart hassana-server
# أو
npm start
```

**4. تحقق من النجاح:**
```bash
# يجب أن ترى في logs:
# 📌 Loading Firebase from environment variable
# ✅ Firebase Admin SDK initialized successfully
#    Using config from: Environment Variable
```

---

### **الحل 3: استخدام Secret Manager (للمشاريع الكبيرة)** 🏢

#### **AWS Secrets Manager:**
```bash
# احفظ في AWS
aws secretsmanager create-secret \
  --name firebase-service-account \
  --secret-string file://src/config/hassanaserver-firebase-adminsdk.json
```

#### **في الكود:**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const secret = await secretsManager.getSecretValue({
  SecretId: 'firebase-service-account'
}).promise();

const serviceAccount = JSON.parse(secret.SecretString);
```

---

## 📋 Checklist للنشر

- [ ] **قبل النشر:**
  - [ ] تأكد من وجود ملف Firebase محلياً
  - [ ] تأكد من عمل Firebase على جهازك: `npm start`
  - [ ] احفظ نسخة احتياطية من الملف

- [ ] **أثناء النشر:**
  - [ ] ارفع الكود إلى GitHub (الملف لن يُرفع تلقائياً)
  - [ ] اسحب الكود على السيرفر: `git pull`
  - [ ] انسخ ملف Firebase يدوياً (الحل 1 أو 2)
  - [ ] تأكد من الصلاحيات: `chmod 600 src/config/hassanaserver-firebase-adminsdk*.json`

- [ ] **بعد النشر:**
  - [ ] أعد تشغيل التطبيق
  - [ ] تحقق من logs: يجب أن ترى "✅ Firebase Admin SDK initialized"
  - [ ] اختبر إرسال إشعار من لوحة التحكم
  - [ ] تأكد من وصول الإشعار للهاتف

---

## 🧪 اختبار Firebase على السيرفر

### **1. فحص حالة Firebase:**
```bash
curl http://your-server:3000/api/test/firebase-status
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "✅ Firebase is initialized",
  "data": {
    "projectId": "hassanaserver",
    "initialized": true
  }
}
```

### **2. اختبار إرسال إشعار:**
```bash
curl -X POST http://your-server:3000/api/test/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "YOUR_REAL_FCM_TOKEN",
    "title": "Test from Server",
    "body": "Firebase works on production!"
  }'
```

---

## ⚠️ استكشاف الأخطاء

### **خطأ 1: Firebase not initialized**
```
⚠️ Firebase initialization skipped: Firebase service account not found
```

**الحل:**
- تأكد من وجود الملف في `src/config/`
- أو تأكد من إضافة `FIREBASE_SERVICE_ACCOUNT` في `.env`

### **خطأ 2: Permission denied**
```
Error: EACCES: permission denied
```

**الحل:**
```bash
chmod 600 src/config/hassanaserver-firebase-adminsdk*.json
chown $USER:$USER src/config/hassanaserver-firebase-adminsdk*.json
```

### **خطأ 3: Invalid JWT Signature**
```
invalid_grant: Invalid JWT Signature
```

**الحل:**
- الملف تالف أو مقطوع
- حمّل ملف جديد من Firebase Console
- تأكد من نسخ الملف كاملاً بدون تعديل

---

## 🔒 نصائح الأمان

1. **لا ترفع الملف أبداً إلى GitHub** ✅ (محمي في .gitignore)
2. **لا تشارك محتوى الملف** مع أي شخص
3. **استخدم Environment Variables في الإنتاج** بدلاً من الملفات
4. **احذف الملفات القديمة** بعد إنشاء private key جديد
5. **راقب الصلاحيات:** فقط المالك يستطيع القراءة
   ```bash
   chmod 600 src/config/hassanaserver-firebase-adminsdk*.json
   ```

---

## 📚 المراجع

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Generate new private key](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)
- [FCM Server Setup](https://firebase.google.com/docs/cloud-messaging/server)

---

## 🆘 الدعم

إذا واجهت مشاكل:

1. **تحقق من logs السيرفر:**
   ```bash
   pm2 logs hassana-server
   ```

2. **اختبر Firebase محلياً أولاً:**
   ```bash
   npm start
   # يجب أن ترى: ✅ Firebase Admin SDK initialized successfully
   ```

3. **تحقق من ملف .env:**
   ```bash
   cat .env | grep FIREBASE
   ```

---

**تاريخ التحديث:** 2025-11-02  
**الإصدار:** 1.0
