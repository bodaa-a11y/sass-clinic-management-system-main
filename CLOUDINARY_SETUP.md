# إعداد Cloudinary لتخزين صور الأشعة

## ما هو Cloudinary؟
Cloudinary هي خدمة تخزين سحابية للصور والفيديوهات مع خطة مجانية سخية:
- **25GB** تخزين
- **25GB** باندويث شهري
- تحويل تلقائي للصور
- CDN عالمي
- API مبسط وسهل الاستخدام

## الخطوة 1: إنشاء حساب Cloudinary

1. اذهب إلى [cloudinary.com](https://cloudinary.com)
2. انقر على "Sign Up"
3. اختر الخطة المجانية (Free)
4. أكمل عملية التسجيل

## الخطوة 2: الحصول على بيانات API

1. بعد تسجيل الدخول، اذهب إلى Dashboard
2. ستجد بيانات API الخاصة بك:
   - **Cloud Name** (مثل: abc123xyz)
   - **API Key** (مثل: 123456789)
   - **API Secret** (مثل: abcdef123456)

## الخطوة 3: إعداد Environment Variables

أضف المتغيرات التالية إلى ملف `.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## الخطوة 4: اختبار الإعداد

بعد إضافة المتغيرات، يمكنك اختبار رفع صورة من خلال:
1. فتح صفحة الطبيب
2. الذهاب إلى تبويب "الأشعة"
3. النقر على زر "+ رفع صورة"
4. اختيار صورة ورفعها

## الميزات

- ✅ رفع آمن للصور
- ✅ تحويل تلقائي للصور (resize, optimize)
- ✅ CDN عالمي لسرعة التحميل
- ✅ تنظيم الصور في مجلدات حسب العيادة والمريض
- ✅ Audit logging لجميع عمليات الرفع

## الأمان

- API Secret يتم تخزينه فقط على الخادم (server-side)
- لا يتم إرساله إلى المتصفح
- جميع عمليات الرفع تمر عبر validateTenantScope
- يتم تسجيل جميع العمليات في audit logs
