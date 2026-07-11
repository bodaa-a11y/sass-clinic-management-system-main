# دليل أنواع العيادة والباقات

## نظرة عامة

النظام يدعم 3 أنواع من العيادات و3 باقات مختلفة، مع نظام موديولات ديناميكي يحدد الميزات المتاحة لكل عيادة.

## أنواع العيادة (Facility Types)

### 1. عيادة لطبيب واحد (single_clinic)
- **الوصف:** عيادة صغيرة بطبيب واحد أو عدد قليل من الأطباء
- **الموديولات المفعلة (10):**
  - appointments (المواعيد)
  - patients (المرضى)
  - medical_records (السجلات الطبية)
  - prescriptions (الأدوية والوصفات)
  - invoices (الفواتير)
  - payments (المدفوعات)
  - specialties (التخصصات)
  - calendar (التقويم)
  - schedule (الجدول الزمني)
  - live-monitor (المراقب المباشر)
- **الموديولات غير المفعلة:**
  - staff_management (إدارة الطاقم)
  - reports (التقارير)
  - departments (الأقسام)

### 2. عيادة متعددة الأطباء (multi_clinic)
- **الوصف:** عيادة متوسطة بعدة أطباء وموظفين
- **الموديولات المفعلة (12):**
  - جميع موديولات single_clinic (10)
  - staff_management (إدارة الطاقم)
  - reports (التقارير)
- **الموديولات غير المفعلة:**
  - departments (الأقسام)

### 3. مركز طبي (medical_center)
- **الوصف:** مركز طبي كبير أو مستشفى
- **الموديولات المفعلة (13):**
  - جميع موديولات multi_clinic (12)
  - departments (الأقسام)
- **الموديولات غير المفعلة:**
  - لا يوجد (كل الموديولات مفعلة)

## الباقات (Editions)

### 1. الأساسية (basic)
- **الوصف:** الباقة الأساسية للعيادات الصغيرة والمتوسطة
- **الميزات:** جميع الموديولات الأساسية حسب نوع العيادة
- **الاستخدام:** العيادات التي تحتاج ميزات أساسية فقط

### 2. المحترفة (pro)
- **الوصف:** الباقة المحترفة للعيادات المتوسطة
- **الميزات:** جميع الموديولات الأساسية + ميزات إضافية (قيد التطوير)
- **الاستخدام:** العيادات التي تحتاج ميزات متقدمة

### 3. المؤسسات (enterprise)
- **الوصف:** باقة المؤسسات للمراكز الطبية الكبيرة
- **الميزات:** جميع الموديولات + ميزات متقدمة (قيد التطوير)
- **الاستخدام:** المراكز الطبية الكبيرة والمستشفيات

## كيف يعمل النظام

### 1. إنشاء عيادة جديدة
```typescript
// Super Admin يختار:
- نوع العيادة (single_clinic, multi_clinic, medical_center)
- الباقة (basic, pro, enterprise)
```

### 2. تحديد الموديولات تلقائياً
```typescript
// النظام يحدد enabledModules تلقائياً حسب نوع العيادة:
const enabledModules = getModulesForFacilityType(facilityType);
```

### 3. حفظ في Database
```sql
-- يتم حفظ:
- facilityType: 'single_clinic'
- edition: 'basic'
- enabledModules: ['appointments', 'patients', ...]
```

### 4. Login وعرض القائمة
```typescript
// عند login:
1. API يرجع clinicConfig
2. clinicConfig يتم حفظه في localStorage
3. tenant-context يقرأ clinicConfig
4. dynamic-sidebar يفلتر العناصر حسب enabledModules
5. القائمة الجانبية تعرض الصفحات المفعلة فقط
```

## Super Admin

### تعديل إعدادات عيادة
1. **اذهب** إلى `/admin/clinics`
2. **اضغط** زر الإعدادات (⚙️) بجانب العيادة
3. **عدّل**:
   - نوع العيادة (سيتم تحديث enabledModules تلقائياً)
   - الباقة
4. **اضغط** حفظ التغييرات

### عرض الموديولات
- في dialog التعديل، يتم عرض جميع enabledModules كـ Badges
- عند تغيير نوع العيادة، يتم تحديث enabledModules تلقائياً

## Clinic Admin

### تحديث الإعدادات
1. **اذهب** إلى `/dashboard/settings`
2. **اضغط** "تحديث الإعدادات من السيرفر"
3. سيتم تحديث clinicConfig من database
4. ستتحدث القائمة الجانبية تلقائياً

## API Routes

### GET /api/admin/clinics
- يرجع قائمة العيادات مع:
  - facilityType
  - edition
  - enabledModules
  - config

### PATCH /api/admin/clinics/[id]
- يسمح بتعديل:
  - facilityType
  - edition
  - enabledModules (يُحدد تلقائياً حسب facilityType)
  - config

### POST /api/auth/login
- يرجع clinicConfig في response:
```json
{
  "user": {
    "clinicConfig": {
      "facilityType": "multi_clinic",
      "edition": "basic",
      "enabledModules": [...],
      "config": {}
    }
  },
  "token": "..."
}
```

## Files الرئيسية

### Configuration
- `lib/modules-config.ts` - تعريف الموديولات لكل نوع عيادة

### Client-side
- `lib/tenant-context.tsx` - قراءة clinicConfig من localStorage
- `components/dynamic-sidebar.tsx` - فلترة القائمة الجانبية
- `lib/store.ts` - إدارة localStorage

### API
- `app/api/admin/clinics/route.ts` - Super Admin clinics API
- `app/api/admin/clinics/[id]/route.ts` - Super Admin single clinic API
- `app/api/auth/login/route.ts` - Login API

### UI
- `app/admin/clinics/page.tsx` - Super Admin clinics management
- `app/dashboard/settings/page.tsx` - Clinic settings page

## التحقق من العمل

### اختبار 1: إنشاء عيادة single_clinic
1. Super Admin → إنشاء عيادة
2. اختر "عيادة لطبيب واحد" + "الأساسية"
3. Login كـ Clinic Admin
4. **نتيجة متوقعة:** القائمة تعرض 10 عناصر (بدون staff_management, reports, departments)

### اختبار 2: تعديل إلى multi_clinic
1. Super Admin → تعديل العيادة
2. غيّر إلى "عيادة متعددة الأطباء"
3. Clinic Admin → تحديث الإعدادات
4. **نتيجة متوقعة:** القائمة تعرض 12 عنصر (مع staff_management, reports)

### اختبار 3: تعديل إلى medical_center
1. Super Admin → تعديل العيادة
2. غيّر إلى "مركز طبي"
3. Clinic Admin → تحديث الإعدادات
4. **نتيجة متوقعة:** القائمة تعرض 13 عنصر (مع staff_management, reports, departments)

## Server-Side Protection

### Middleware Protection
النظام يستخدم middleware لحماية الصفحات على مستوى server-side:
- **middleware.ts** يتحقق من `enabledModules` قبل السماح بالوصول للصفحات
- إذا حاول المستخدم الوصول لصفحة غير مفعلة، يتم redirect إلى `/dashboard`
- هذا يمنع المستخدمين من الوصول للصفحات المحظورة عن طريق كتابة الرابط مباشرة

### Protected Routes
جميع الصفحات التالية محمية:
- `/dashboard/appointments` - يتطلب `appointments`
- `/dashboard/patients` - يتطلب `patients`
- `/dashboard/medical-records` - يتطلب `medical_records`
- `/dashboard/prescriptions` - يتطلب `prescriptions`
- `/dashboard/invoices` - يتطلب `invoices`
- `/dashboard/payments` - يتطلب `payments`
- `/dashboard/specialties` - يتطلب `specialties`
- `/dashboard/calendar` - يتطلب `calendar`
- `/dashboard/schedule` - يتطلب `schedule`
- `/dashboard/live-monitor` - يتطلب `live-monitor`
- `/dashboard/staff-management` - يتطلب `staff_management`
- `/dashboard/reports` - يتطلب `reports`
- `/dashboard/departments` - يتطلب `departments`

### Public Routes (Always Accessible)
- `/dashboard` - لوحة التحكم الرئيسية
- `/dashboard/settings` - صفحة الإعدادات
- `/dashboard/login` - صفحة تسجيل الدخول

## Troubleshooting

### المشكلة: القائمة الجانبية تعرض فقط لوحة التحكم والإعدادات
**الحل:**
1. افتح Console واكتب:
```javascript
localStorage.getItem('clinicConfig')
```
2. إذا كان null:
   - Logout
   - Login مرة أخرى
   - أو اضبطه يدوياً:
```javascript
localStorage.setItem('clinicConfig', JSON.stringify({
  "facilityType": "single_clinic",
  "edition": "basic",
  "enabledModules": getModulesForFacilityType("single_clinic"),
  "config": {}
}))
```
3. Refresh الصفحة

### المشكلة: المستخدم يمكنه الوصول للصفحات المحظورة عن طريق كتابة الرابط مباشرة
**الحل:**
- النظام يستخدم middleware لحماية الصفحات على مستوى server-side
- إذا حاول المستخدم الوصول لصفحة غير مفعلة (مثل `/dashboard/staff-management` لعيادة single_clinic)، سيتم redirect تلقائياً إلى `/dashboard`
- هذه الحماية تعمل لجميع الأدوار: clinic_admin, doctor, receptionist
- لا يمكن تجاوز هذه الحماية لأنها على مستوى middleware (قبل تحميل الصفحة)

### المشكلة: enabledModules لا تتحدث بعد تعديل نوع العيادة
**الحل:**
- Clinic Admin يجب أن يضغط "تحديث الإعدادات من السيرفر" في صفحة الإعدادات
- أو Logout ثم Login مرة أخرى

### المشكلة: Super Admin لا يمكن تعديل العيادات
**الحل:**
- تأكد أنك logged in كـ super_admin
- تحقق من localStorage:
```javascript
localStorage.getItem('user')
```
- إذا role != 'super_admin':
  - Logout
  - Login كـ super_admin
