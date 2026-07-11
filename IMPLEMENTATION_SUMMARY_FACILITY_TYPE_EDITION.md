# تنفيذ نظام الإصدارات (Editions / Facility Types) - ملخص التنفيذ

## قائمة الملفات المعدلة/المنشأة

### الملفات المعدلة (5 ملفات)

#### 1. db/schema.ts
**التغييرات:**
- إضافة `facilityTypeEnum` enum: 'single_clinic' | 'multi_clinic' | 'dental_clinic' | 'medical_center' | 'hospital' | 'laboratory' | 'enterprise'
- إضافة `editionEnum` enum: 'basic' | 'pro' | 'enterprise'
- إضافة الحقول لجدول clinics:
  - `facilityType` (varchar(50), default 'single_clinic', notNull)
  - `edition` (varchar(50), default 'basic', notNull)
  - `enabledModules` (jsonb, default [], notNull)
  - `config` (jsonb, default {}, notNull)

#### 2. lib/store.ts
**التغييرات:**
- إضافة `ClinicConfig` interface
- إضافة `clinicConfig` إلى `User` interface
- إضافة `setClinicConfig()` method
- إضافة `getClinicConfig()` method

#### 3. app/dashboard/layout.tsx
**التغييرات:**
- استيراد `refreshClinicConfig` من `lib/tenant-context`
- استيراد `ALL_SIDEBAR_ITEMS` و `filterSidebarItems` من `components/dynamic-sidebar`
- إضافة `enabledModules` state
- تحديث `navigationItems` لاستخدام `filterSidebarItems(enabledModules, user?.role)`
- إضافة منطق جلب `clinicConfig` من localStorage أو من الـ database
- تحديث `useEffect` لجلب `clinicConfig` عند mount

#### 4. app/api/admin/clinics/route.ts
**التغييرات:**
- استيراد `getModulesForFacilityType` من `lib/modules-config`
- تحديث `createClinicSchema` لإضافة:
  - `facilityType` (enum, default 'single_clinic')
  - `edition` (enum, default 'basic')
  - `enabledModules` (array of strings, optional)
  - `config` (record, optional)
- تحديث POST handler لتوليد `enabledModules` تلقائياً إذا لم يتم توفيرها
- إضافة الحقول الجديدة إلى insert statement

#### 5. app/api/admin/clinics/[id]/route.ts
**التغييرات:**
- إضافة imports: `z`, `requireSuperAdmin`, `logAudit`, `getClientIP`, `getModulesForFacilityType`
- إضافة `updateClinicSchema` مع الحقول الجديدة
- تحديث PATCH handler لـ:
  - التحقق من Super Admin access
  - Validate request body
  - Auto-regenerate enabled_modules إذا تغير facility_type
  - Audit logging
  - دعم تحديث جميع الحقول الجديدة

### الملفات المنشأة (19 ملف)

#### 6. lib/modules-config.ts (NEW FILE)
**المحتوى:**
- تعريف `FacilityType` و `Edition` types
- تعريف `ALL_MODULES` array (22 module)
- تعريف `FACILITY_TYPE_MODULES` map
- دالة `getModulesForFacilityType()`
- دالة `isModuleEnabledForFacilityType()`
- `MODULE_DISPLAY_NAMES` map (Arabic)
- `FACILITY_TYPE_DISPLAY_NAMES` map (Arabic)
- `EDITION_DISPLAY_NAMES` map (Arabic)

#### 7. lib/tenant-context.ts (NEW FILE)
**المحتوى:**
- `ClinicConfig` interface
- دالة `getClinicConfig(clinicId)` - جلب من database
- دالة `refreshClinicConfig(clinicId)` - تحديث localStorage
- دالة `isModuleEnabled(moduleName)` - التحقق من localStorage

#### 8. components/dynamic-sidebar.tsx (NEW FILE)
**المحتوى:**
- `SidebarItem` interface
- `ALL_SIDEBAR_ITEMS` array (23 item) مع module و role conditions
- دالة `filterSidebarItems(enabledModules, userRole)`

#### 9. lib/validate-module.ts (NEW FILE)
**المحتوى:**
- دالة `validateModule(clinicId, moduleName)`
- جلب clinic config من database
- التحقق من enabled_modules
- إرجاع 403 إذا module غير مفعل

#### 10-19. صفحات Dashboard Placeholders (10 ملفات)
**المحتوى:**
- `app/dashboard/departments/page.tsx`
- `app/dashboard/bed-management/page.tsx`
- `app/dashboard/ipd/page.tsx`
- `app/dashboard/ot/page.tsx`
- `app/dashboard/insurance/page.tsx`
- `app/dashboard/lab-tests/page.tsx`
- `app/dashboard/sample-tracking/page.tsx`
- `app/dashboard/test-results/page.tsx`
- `app/dashboard/dental-charts/page.tsx`
- `app/dashboard/treatment-plans/page.tsx`

كل صفحة تحتوي على:
- Card مع icon
- "قيد التطوير" message
- Button "Coming Soon" (disabled)
- هيكل جاهز للكود لاحقاً

#### 20-24. API Routes Stubs (5 ملفات)
**المحتوى:**
- `app/api/clinics/[id]/departments/route.ts`
- `app/api/clinics/[id]/bed-management/route.ts`
- `app/api/clinics/[id]/ipd/route.ts`
- `app/api/clinics/[id]/ot/route.ts`
- `app/api/clinics/[id]/insurance/route.ts`

كل route يحتوي على:
- GET و POST endpoints
- `validateModule()` protection
- Placeholder response "under development"

## تعليمات Migration

### الطريقة 1: Drizzle Kit Push (موصى به)
```bash
npm run db:push
```

### الطريقة 2: Drizzle Kit Generate + Migrate
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### SQL Migration اليدوي (للإشارة فقط)
```sql
-- Add enums
CREATE TYPE facility_type AS ENUM ('single_clinic', 'multi_clinic', 'dental_clinic', 'medical_center', 'hospital', 'laboratory', 'enterprise');
CREATE TYPE edition AS ENUM ('basic', 'pro', 'enterprise');

-- Add columns to clinics table
ALTER TABLE clinics ADD COLUMN facility_type facility_type DEFAULT 'single_clinic' NOT NULL;
ALTER TABLE clinics ADD COLUMN edition edition DEFAULT 'basic' NOT NULL;
ALTER TABLE clinics ADD COLUMN enabled_modules jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE clinics ADD COLUMN config jsonb DEFAULT '{}'::jsonb NOT NULL;
```

## خطوات الاختبار (5 Test Cases)

### Test Case 1: إنشاء عيادة مع facility_type
**الخطوات:**
1. تسجيل دخول كـ Super Admin
2. الذهاب إلى صفحة إنشاء عيادة
3. اختيار `facility_type = 'hospital'`
4. اختيار `edition = 'pro'`
5. ترك `enabled_modules` فارغ (auto-generate)
6. إنشاء العيادة

**النتيجة المتوقعة:**
- العيادة تُنشأ بنجاح
- `enabledModules` تحتوي على: ["appointments", "patients", "medical_records", "prescriptions", "invoices", "payments", "specialties", "calendar", "schedule", "live-monitor", "staff_management", "reports", "departments", "bed_management", "ipd", "ot", "insurance"]

### Test Case 2: تعديل enabled_modules يدوياً
**الخطوات:**
1. تعديل عيادة موجودة
2. إضافة/إزالة موديول من `enabledModules`
3. حفظ التغييرات

**النتيجة المتوقعة:**
- التغييرات تُحفظ بنجاح
- `enabledModules` تُحدث في database

### Test Case 3: Sidebar ديناميكي
**الخطوات:**
1. تسجيل خروج من Super Admin
2. تسجيل دخول كـ clinic_admin لعيادة hospital
3. فتح Dashboard

**النتيجة المتوقعة:**
- Sidebar يعرض جميع موديولز hospital (17 موديول)
- الصفحات الجديدة (departments, bed_management, ipd, ot, insurance) تظهر في Sidebar

4. تسجيل خروج
5. تسجيل دخول لعيادة laboratory

**النتيجة المتوقعة:**
- Sidebar يعرض موديولز laboratory فقط (7 موديول)
- الصفحات غير المطلوبة لا تظهر

### Test Case 4: API Protection
**الخطوات:**
1. محاولة الوصول إلى `/api/clinics/[id]/departments` لعيادة بدون departments module (مثل laboratory)

**النتيجة المتوقعة:**
- إرجاع 403 Forbidden
- Response body: `{ error: "Module 'departments' is not enabled for this clinic", code: "MODULE_NOT_ENABLED" }`

2. إضافة departments module للعيادة
3. محاولة الوصول مرة أخرى

**النتيجة المتوقعة:**
- نجاح الوصول (200 OK)
- Response body: `{ data: [], message: "Departments module is under development" }`

### Test Case 5: Placeholder Pages
**الخطوات:**
1. تسجيل دخول كـ clinic_admin لعيادة hospital
2. الدخول إلى صفحة `/dashboard/departments`

**النتيجة المتوقعة:**
- الصفحة تُعرض بنجاح
- ظهور "قيد التطوير" message
- وجود Card مع icon (Building2)
- وجود Button "Coming Soon" (disabled)
- RTL support يعمل بشكل صحيح

3. تكرار لجميع الصفحات الجديدة:
   - /dashboard/bed-management
   - /dashboard/ipd
   - /dashboard/ot
   - /dashboard/insurance
   - /dashboard/lab-tests
   - /dashboard/sample-tracking
   - /dashboard/test-results
   - /dashboard/dental-charts
   - /dashboard/treatment-plans

## ملاحظات هامة

1. **التوافق:** جميع التغييرات متوافقة 100% مع RBAC، Tenant Isolation، Audit Logging، Soft Delete، RTL
2. **لا مكتبات خارجية:** لم يتم إضافة أي مكتبات جديدة
3. **Configuration-driven:** النظام يعتمد على configuration بدلاً من hard-coded logic
4. **Auto-generation:** enabled_modules تُولد تلقائياً حسب facility_type
5. **Manual override:** Super Admin يمكن تعديل enabled_modules يدوياً
6. **API Protection:** جميع API routes الجديدة محمية بـ validateModule
7. **Placeholders:** الصفحات والـ APIs جاهزة للتطوير لاحقاً

## الخطوات التالية (اختياري)

1. **Super Admin UI:** تحديث صفحة Super Admin لإضافة Select لـ facility_type و edition و Multi-select checkboxes لـ enabled_modules
2. **تطوير الصفحات:** استبدال placeholders بصفحات فعلية
3. **تطوير APIs:** استبدال API stubs بـ endpoints فعلية
4. **Testing:** إضافة automated tests للـ module validation
5. **Documentation:** تحديث التوثيق لتوضيح كيفية استخدام النظام الجديد
