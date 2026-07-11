# Database Migration Guide

## استخدام Drizzle Kit مع Neon

### ما هو Drizzle Kit؟
Drizzle Kit هو أداة CLI لإدارة migrations قاعدة البيانات مع Drizzle ORM.

### أوامر Drizzle Kit المتاحة

```bash
# إنشاء migration file جديد بناءً على التغييرات في schema
npm run db:generate

# تطبيق migration على قاعدة البيانات
npm run db:migrate

# دفع التغييرات مباشرة إلى قاعدة البيانات (للتطوير)
npm run db:push

# فتح Drizzle Studio (واجهة بصرية لإدارة قاعدة البيانات)
npm run db:studio
```

### التغييرات الجديدة في Schema

تم إضافة الجداول التالية:
1. **labResults** - جدول نتائج المختبرات
2. **radiologyImages** - جدول صور الأشعة
3. **labIntegrations** - جدول integrations المختبرات الخارجية

### تشغيل Migration

#### الخيار 1: استخدام db:push (موصى به للتطوير)

```bash
npm run db:push
```

هذا الأمر سيقوم بـ:
- مقارنة schema الحالي مع قاعدة البيانات
- إنشاء الجداول الجديدة تلقائياً
- تطبيق التغييرات مباشرة بدون migration files

#### الخيار 2: استخدام db:generate و db:migrate (موصى به للإنتاج)

```bash
# إنشاء migration file
npm run db:generate

# تطبيق migration
npm run db:migrate
```

### التحقق من التطبيق

بعد تشغيل migration، يمكنك التحقق من الجداول الجديدة:

```bash
npm run db:studio
```

سيفتح Drizzle Studio في متصفحك حيث يمكنك رؤية جميع الجداول والبيانات.

### استخدام Drizzle Studio

Drizzle Studio هو واجهة بصرية لإدارة قاعدة البيانات:
- عرض جميع الجداول
- عرض وإدراج البيانات
- تشغيل SQL queries
- تصفح العلاقات بين الجداول

### ملاحظات مهمة

- **db:push** مناسب للتطوير السريع
- **db:migrate** مناسب للإنتاج حيث يمكنك مراجعة migration files
- تأكد من أن `DATABASE_URL` في `.env.local` صحيح
- تأكد من أن لديك صلاحيات الكتابة في قاعدة البيانات

### حل المشاكل

#### خطأ: "relation already exists"
هذا يعني أن الجدول موجود بالفعل. يمكنك:
1. استخدام `db:push` بدلاً من `db:migrate`
2. أو حذف migration file الحالي وإنشاء جديد

#### خطأ: "permission denied"
تأكد من أن المستخدم في `DATABASE_URL` لديه صلاحيات CREATE TABLE
