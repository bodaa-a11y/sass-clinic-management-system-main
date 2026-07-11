# دليل اختبار الإصلاحات المنفذة

## 📋 نظرة عامة

بسبب مشاكل في إعداد Puppeteer على Windows (يتطلب httpOnly cookies للمصادقة)، تم إنشاء دليل اختبار يدوي شامل لاختبار جميع الإصلاحات المنفذة في النظام.

## 🚀 كيفية الاستخدام

### 1. تشغيل التطبيق
```bash
npm run dev
```
التطبيق سيعمل على `http://localhost:3000`

### 2. عرض دليل الاختبار
```bash
node test-consultations.js
```
هذا سيقوم بعرض قائمة شاملة بجميع الاختبارات المطلوبة.

## ✅ قائمة الاختبارات

### 1. اختبار عرض قائمة الانتظار
- تسجيل الدخول كطبيب (clinic@dr-ahmed.com)
- التوجه إلى `/dashboard/doctor`
- التحقق من عرض قائمة الانتظار
- التحقق من عرض المرضى في حالة "in-waiting-room"

### 2. اختبار بدء استشارة جديدة
- النقر على زر "بدء" لمرضى في قائمة الانتظار
- التحقق من التوجيه إلى صفحة الفحص مع consultationId في URL
- التحقق من إنشاء الاستشارة بحالة "in-progress"

### 3. اختبار Auto-Save
- في صفحة الفحص، تعبئة بعض البيانات (vitals، إلخ)
- الانتظار 2-3 ثواني (debounce time)
- فحص DevTools Network tab لاستدعاء auto-save API
- التحقق من حفظ البيانات بنجاح

### 4. اختبار إتمام الفحص مع Prescriptions
- التوجه إلى تبويب prescriptions
- إضافة prescription
- النقر على زر "إتمام"
- التحقق من التوجيه إلى قائمة الانتظار
- التحقق من تغيير حالة الموعد إلى "done"

### 5. اختبار عرض المواعيد في حالة In-Progress
- إنشاء موعد في حالة "in-progress" (من قاعدة البيانات)
- التوجه إلى `/dashboard/doctor`
- التحقق من عرض قسم in-progress
- التحقق من عرض مواعيد الطبيب فقط في حالة in-progress

### 6. اختبار منع بدء فحص جديد
- بدء استشارة (إنشاء استشارة in-progress)
- محاولة بدء استشارة أخرى لمريض مختلف
- التحقق من رسالة الخطأ: "لديك فحص جاري حالياً مع [اسم المريض]. يرجى إكمال الفحص الحالي قبل بدء فحص جديد."
- التحقق من رمز الحالة 409 (Conflict)

### 7. اختبار الفلترة حسب الدور
- تسجيل الدخول كـ clinic_admin (إذا كان مختلفاً عن الطبيب)
- التحقق من إمكانية رؤية جميع المواعيد
- تسجيل الدخول كطبيب
- التحقق من رؤية المواعيد الخاصة فقط (باستثناء قائمة الانتظار)

## 🔍 فحوصات إضافية

- **Error handling**: جميع الأخطاء يجب أن يكون لها رسائل واضحة بالعربية
- **Loading states**: عرض مؤشرات التحميل أثناء استدعاءات API
- **UI consistency**: فحص التصميم للتأكد من مطابقته لـ Shadcn/UI
- **Responsive design**: اختبار على أحجام شاشات مختلفة

## 📝 قالب النتائج

```
Test Results:
-------------
1. Waiting List Display: [PASS/FAIL] - Notes: ...
2. Start Consultation: [PASS/FAIL] - Notes: ...
3. Auto-Save: [PASS/FAIL] - Notes: ...
4. Complete Exam: [PASS/FAIL] - Notes: ...
5. In-Progress Display: [PASS/FAIL] - Notes: ...
6. Prevent New Consultation: [PASS/FAIL] - Notes: ...
7. Role-Based Filtering: [PASS/FAIL] - Notes: ...

Overall Status: [PASS/FAIL]
Issues Found: ...
```

## 💡 نصائح

- استخدام DevTools لمراقبة استدعاءات API
- فحص console لأي أخطاء JavaScript
- اختبار مع سيناريوهات عيادة بطبيب واحد وعيادة متعددة الأطباء
- التحقق من حالة قاعدة البيانات بعد كل اختبار

## 🐛 الإصلاحات المنفذة

### 1. إضافة getActiveByDoctor في consultationService
- إضافة دالة جديدة للتحقق من وجود استشارة نشطة للطبيب

### 2. تحديث consultations/start route
- إضافة تحقق من وجود استشارة نشطة للطبيب
- إرجاع خطأ 409 مع رسالة واضحة

### 3. تحديث startConsultation في exam-service
- استخراج رسالة الخطأ من response
- رمي Error مع رسالة محددة

### 4. تحديث handleStartExam في use-doctor-exam
- عرض رسالة خطأ مناسبة للمستخدم
- استخدام error.message من API

### 5. تحديث appointments GET route
- إضافة فلترة حسب الدور (doctor vs clinic_admin)
- الأطباء يرون مواعيدهم الخاصة
- clinic_admin يرى جميع المواعيد

### 6. إضافة userRole إلى PatientSlice
- إضافة userRole state
- إضافة setUserRole action

### 7. تحديث useInProgressAppointments
- استخدام userRole للفلترة
- clinic_admin يرى جميع المواعيد في حالة in-progress
- doctor يرى فقط مواعيده الخاصة

## 📞 الدعم

إذا واجهت أي مشاكل أثناء الاختبار، يرجى:
1. فحص console في DevTools للأخطاء
2. فحص Network tab لاستدعاءات API الفاشلة
3. التحقق من حالة قاعدة البيانات
4. الإبلاغ عن المشكلة مع تفاصيل الخطأ
