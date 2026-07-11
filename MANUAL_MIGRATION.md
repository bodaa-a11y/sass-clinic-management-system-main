# تشغيل Database Migration يدوياً

## الطريقة 1: عبر واجهة Neon Console

1. اذهب إلى [Neon Console](https://console.neon.tech)
2. اختر مشروعك
3. اذهب إلى "SQL Editor"
4. انسخ محتوى ملف `drizzle/0002_add_lab_results_and_radiology_images.sql`
5. الصقه في SQL Editor
6. انقر على "Run"

## الطريقة 2: عبر psql (إذا كان مثبتاً)

```bash
psql $DATABASE_URL -f drizzle/0002_add_lab_results_and_radiology_images.sql
```

## الطريقة 3: عبر Node.js script

قم بإنشاء ملف `run-migration.js`:

```javascript
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  const sql = fs.readFileSync('./drizzle/0002_add_lab_results_and_radiology_images.sql', 'utf8');
  await pool.query(sql);
  console.log('Migration completed successfully!');
  await pool.end();
}

runMigration().catch(console.error);
```

ثم شغله:
```bash
node run-migration.js
```

## التحقق من التطبيق

بعد تشغيل migration، يمكنك التحقق من الجداول الجديدة:

```sql
-- التحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lab_results', 'radiology_images', 'lab_integrations');

-- التحقق من الأنواع
SELECT typname FROM pg_type WHERE typname IN ('lab_result_status', 'lab_integration_type');
```

## الجداول الجديدة

1. **lab_results** - جدول نتائج المختبرات
2. **radiology_images** - جدول صور الأشعة
3. **lab_integrations** - جدول integrations المختبرات الخارجية

## الأنواع الجديدة

1. **lab_result_status** - enum: pending, completed, cancelled
2. **lab_integration_type** - enum: internal, external
