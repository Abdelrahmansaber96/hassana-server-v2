# 🐪 نظام إدارة تطعيمات الحيوانات - Animal Vaccination Management System

نظام إداري شامل مصمم خصيصاً للعيادات البيطرية لإدارة تطعيمات الحيوانات والحجوزات مع دعم كامل للعملاء ونظام أسعار متكامل.

## 🚀 المميزات الحديثة

### 🏥 للإدارة
- **لوحة التحكم**: إحصائيات مباشرة مع الرسوم البيانية
- **إدارة التطعيمات**: نظام شامل مع الأسعار ونوع الحيوان المناسب  
- **إدارة العملاء**: نظام بسيط برقم الهاتف والاسم فقط
- **الحجوزات**: نظام حجز متطور مع إدارة المواعيد والأسعار
- **الفروع والأطباء**: إدارة شاملة لفروع العيادة والكادر الطبي

### 👥 للعملاء - API مخصص
- **تسجيل بسيط**: برقم الهاتف والاسم فقط (بدون إيميل أو هوية)
- **إدارة الحيوانات**: إضافة وإدارة الحيوانات الشخصية
- **التطعيمات الذكية**: عرض التطعيمات المناسبة حسب نوع الحيوان والعمر
- **حجز المواعيد**: حجز سهل مع معرفة الأسعار مسبقاً
- **متابعة الحجوزات**: عرض وإدارة الحجوزات مع إمكانية الإلغاء

## 💉 نظام التطعيمات والأسعار

### التطعيمات المتوفرة:
1. **مرض الحمى القلاعية** - 150 ريال سعودي
2. **البروسيلا** - 200 ريال سعودي
3. **الكلوستريديا** - 120 ريال سعودي
4. **داء الكلب** - 180 ريال سعودي
5. **التيتانوس** - 100 ريال سعودي
6. **طاعون المجترات الصغيرة** - 80 ريال سعودي
7. **الجلد العقدي** - 250 ريال سعودي
8. **جدري الإبل** - 300 ريال سعودي

### أنواع الحيوانات المدعومة:
- 🐪 إبل (Camel)
- 🐑 أغنام (Sheep)  
- 🐐 ماعز (Goat)
- 🐄 ماشية (Cow)
- 🐎 خيول (Horse)
- 🦎 أخرى (Other)

## 🛠️ التقنيات المستخدمة

- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Architecture**: MVC Pattern

## 📦 التثبيت والتشغيل

### المتطلبات
- Node.js (v16 أو أحدث)
- MongoDB (v5 أو أحدث)
- npm أو yarn

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd "clinic dashboard"
```

2. **تثبيت الحزم**
```bash
npm install
```

3. **إعداد متغيرات البيئة**
أنشئ ملف `.env` وأضف:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/animal_clinic
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
WHATSAPP_API_TOKEN=your-whatsapp-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

4. **بدء MongoDB**
```bash
mongod
```

5. **إدخال البيانات التجريبية**
```bash
npm run seed
```

6. **تشغيل السيرفر**
```bash
# وضع التطوير
npm run dev

# وضع الإنتاج
npm start
```

## 📝 واجهة برمجة التطبيقات (API)

### نقاط النهاية الرئيسية

#### المصادقة
- `POST /api/auth/register` - تسجيل مستخدم نظام جديد (مدير/موظف/طبيب)
  - **المطلوب**: الاسم، البريد الإلكتروني، كلمة المرور، الصلاحية
  - **الهدف**: إنشاء حساب مستخدم يمكنه تسجيل الدخول للنظام
- `POST /api/auth/register-customer` - تسجيل عميل جديد (مبسط)
  - **المطلوب**: الاسم، رقم الهاتف
  - **اختياري**: نوع الحيوان، ملاحظات
  - **الهدف**: إنشاء سجل عميل في النظام لحجز المواعيد
- `POST /api/auth/login` - تسجيل دخول مستخدمي النظام
- `GET /api/auth/profile` - الحصول على بيانات المستخدم
- `PUT /api/auth/profile` - تحديث بيانات المستخدم

#### لوحة التحكم
- `GET /api/dashboard/stats` - الإحصائيات العامة
- `GET /api/dashboard/charts` - بيانات الرسوم البيانية
- `GET /api/dashboard/recent-activity` - النشاطات الأخيرة

#### العملاء
- `GET /api/customers` - قائمة العملاء
- `POST /api/auth/register-customer` - إضافة عميل جديد (مبسط: اسم + هاتف)
- `GET /api/customers/:id` - تفاصيل العميل  
- `PUT /api/customers/:id` - تحديث بيانات العميل
- `DELETE /api/customers/:id` - حذف العميل

> **ملاحظة**: تم تحديث مسار تسجيل العملاء الجدد من `/api/customers` إلى `/api/auth/register-customer` 
> لتبسيط عملية التسجيل (اسم ورقم هاتف فقط بدلاً من البريد الإلكتروني وكلمة المرور)

#### الحجوزات
- `GET /api/bookings` - قائمة الحجوزات
- `POST /api/bookings` - إنشاء حجز جديد
- `GET /api/bookings/:id` - تفاصيل الحجز
- `PUT /api/bookings/:id` - تحديث الحجز
- `DELETE /api/bookings/:id` - إلغاء الحجز

#### الفروع
- `GET /api/branches` - قائمة الفروع
- `POST /api/branches` - إضافة فرع جديد
- `GET /api/branches/:id` - تفاصيل الفرع
- `PUT /api/branches/:id` - تحديث الفرع

#### الاستشارات
- `GET /api/consultations` - قائمة الاستشارات
- `POST /api/consultations` - إنشاء استشارة جديدة
- `PUT /api/consultations/:id` - تحديث الاستشارة

#### العروض
- `GET /api/offers` - قائمة العروض
- `POST /api/offers` - إضافة عرض جديد
- `PUT /api/offers/:id` - تحديث العرض

#### الإشعارات
- `GET /api/notifications` - قائمة الإشعارات
- `POST /api/notifications` - إرسال إشعار
- `PUT /api/notifications/:id/read` - تعليم كمقروء

## � التحديثات الجديدة (v2.0)

### تحديث نموذج العملاء
- **إزالة حقول**: `email` و `nationalId` من نموذج Customer
- **تبسيط التسجيل**: الآن يتطلب اسم ورقم هاتف فقط
- **مسار جديد**: `/api/auth/register-customer` للتسجيل المبسط

### تحديث أنواع الحيوانات
```javascript
// الأنواع المدعومة (بالإنجليزية في قاعدة البيانات)
enum: ['camel', 'sheep', 'goat', 'cow', 'horse', 'other']

// المطابقة مع الأسماء العربية
{
  'إبل': 'camel',
  'ماشية': 'cow', 
  'أغنام': 'sheep',
  'ماعز': 'goat',
  'خيول': 'horse',
  'أخرى': 'other'
}
```

### تحديث الواجهة
- **حذف عمود البريد الإلكتروني** من جدول العملاء
- **تحديث نموذج إضافة العميل** لإزالة حقول email
- **استخدام المسار الجديد** في نماذج الواجهة

## �🗄️ هيكل قاعدة البيانات

### النماذج الأساسية

1. **User** - المستخدمين (مدراء، موظفين، أطباء)
2. **Customer** - العملاء وحيواناتهم *(محدث)*
3. **Branch** - فروع العيادة
4. **Booking** - حجوزات التطعيمات
5. **Consultation** - الاستشارات الهاتفية
6. **Offer** - العروض والخصومات
7. **Notification** - الإشعارات

### نموذج العملاء المحدث (Customer)

```javascript
{
  name: String,           // الاسم (مطلوب)
  phone: String,          // رقم الهاتف (مطلوب)
  address: String,        // العنوان (اختياري)
  city: String,          // المدينة (اختياري)
  animals: [{            // قائمة الحيوانات
    name: String,        // اسم الحيوان
    type: String,        // نوع الحيوان (enum)
    age: Number,         // العمر
    weight: Number,      // الوزن
    breed: String,       // السلالة
    isActive: Boolean    // نشط/غير نشط
  }],
  notes: String,         // ملاحظات (اختياري)
  isActive: Boolean,     // حالة العميل
  totalBookings: Number, // إجمالي الحجوزات
  lastBookingDate: Date, // تاريخ آخر حجز
  timestamps: true       // تواريخ الإنشاء والتحديث
}
```

> **تم حذف**: `email` و `nationalId` من النموذج لتبسيط عملية التسجيل

## 🔒 الأمان

- **JWT Authentication** - مصادقة آمنة
- **Password Hashing** - تشفير كلمات المرور
- **Rate Limiting** - حماية من الهجمات
- **CORS** - إعدادات الـ CORS الآمنة
- **Helmet** - حماية Headers الـ HTTP
- **Input Validation** - التحقق من صحة المدخلات

## 📊 الخدمات المدمجة

### خدمة WhatsApp
- إرسال إشعارات تأكيد الحجز
- تذكير بالمواعيد
- نتائج الاستشارات

### خدمة الإشعارات
- إشعارات فورية (Real-time)
- إشعارات بالبريد الإلكتروني
- إشعارات WhatsApp

## 🧪 بيانات تجريبية

بعد تشغيل `npm run seed`، ستحصل على:

### حسابات المستخدمين
- **Admin**: admin@clinic.com / password123
- **Doctor 1**: doctor1@clinic.com / password123
- **Doctor 2**: doctor2@clinic.com / password123
- **Staff**: staff1@clinic.com / password123

### البيانات التجريبية
- 3 فروع
- 6 مستخدمين
- 5 عملاء
- 50 حجز
- 25 استشارة
- 2 عرض

## 📁 هيكل المشروع

```
src/
├── config/
│   └── database.js          # إعدادات قاعدة البيانات
├── controllers/             # التحكم في المنطق
│   ├── authController.js
│   ├── dashboardController.js
│   ├── customerController.js
│   ├── bookingController.js
│   ├── branchController.js
│   ├── consultationController.js
│   ├── offerController.js
│   └── notificationController.js
├── middlewares/             # الوسطاء
│   ├── auth.js
│   ├── authorize.js
│   ├── validate.js
│   └── errorHandler.js
├── models/                  # نماذج قاعدة البيانات
│   ├── User.js
│   ├── Customer.js
│   ├── Branch.js
│   ├── Booking.js
│   ├── Consultation.js
│   ├── Offer.js
│   └── Notification.js
├── routes/                  # المسارات
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── customerRoutes.js
│   ├── bookingRoutes.js
│   ├── branchRoutes.js
│   ├── consultationRoutes.js
│   ├── offerRoutes.js
│   └── notificationRoutes.js
├── services/                # الخدمات
│   ├── whatsappService.js
│   └── notificationService.js
├── utils/                   # الأدوات المساعدة
│   ├── pagination.js
│   ├── filter.js
│   └── helpers.js
├── validators/              # التحقق من صحة البيانات
│   ├── authValidator.js
│   ├── customerValidator.js
│   ├── bookingValidator.js
│   ├── branchValidator.js
│   ├── consultationValidator.js
│   ├── offerValidator.js
│   └── notificationValidator.js
├── seeds/                   # البيانات التجريبية
│   └── index.js
└── server.js               # نقطة البداية
```

## 🧪 صفحة اختبار API

تم إنشاء صفحة اختبار مخصصة لتجربة مسار تسجيل العملاء الجديد:

### الوصول للصفحة
```
http://localhost:3000/test-customer-registration.html
```

### المميزات
- **واجهة سهلة الاستخدام** بالعربية مع دعم RTL
- **اختبار مباشر** لمسار `/api/auth/register-customer`
- **عرض النتائج** مع تفاصيل الاستجابة
- **التحقق من الأخطاء** وعرضها بشكل واضح

### كيفية الاستخدام
1. شغل الخادم: `npm start`
2. افتح الرابط في المتصفح
3. املأ البيانات:
   - **الاسم** (مطلوب)
   - **رقم الهاتف** (مطلوب - صيغة سعودية)
   - **نوع الحيوان** (اختياري)
   - **ملاحظات** (اختياري)
4. اضغط "تسجيل العميل"
5. شاهد النتيجة في الأسفل

## 🚀 النشر

### للإنتاج
1. تأكد من تحديث متغيرات البيئة
2. قم بإنشاء build للإنتاج
3. استخدم PM2 لإدارة العمليات

```bash
npm install -g pm2
pm2 start src/server.js --name "animal-clinic-api"
```

## 🤝 المساهمة

نرحب بالمساهمات! يرجى قراءة إرشادات المساهمة قبل البدء.

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## 📞 الدعم

للاستفسارات والدعم الفني، يرجى التواصل معنا عبر:
- البريد الإلكتروني: support@animalclinic.com
- الهاتف: +1234567890

## 📚 ملفات إضافية

### دليل تسجيل العملاء
- **الملف**: `CUSTOMER_REGISTRATION.md`
- **المحتوى**: دليل شامل لاستخدام مسار تسجيل العملاء الجديد
- **يتضمن**: أمثلة، أكواد، والتعامل مع الأخطاء

### صفحة الاختبار
- **الملف**: `public/test-customer-registration.html`
- **الغرض**: اختبار مسار تسجيل العملاء مباشرة من المتصفح
- **المميزات**: واجهة عربية مع دعم RTL وعرض النتائج

---

**طُور بحب ❤️ لإدارة أفضل لعيادات الحيوانات**