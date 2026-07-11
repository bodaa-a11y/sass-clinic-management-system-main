# Migration Guide
# دليل الترحيل

## 📋 Overview
This guide helps you migrate from the old design system to the new redesigned components.

---

## 🔄 What Changed

### Component Imports
**Before:**
```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

**After:**
```tsx
import { Button } from '@/components/ui/button-redesigned'
import { Card } from '@/components/ui/card-redesigned'
```

### Animations
**Before:**
```tsx
import { BounceIn, StaggerChildren } from '@/components/animations'
```

**After:**
```tsx
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'
```

---

## 🎨 Color Updates

### Old Colors
```tsx
className="text-blue-600"
className="bg-gray-100"
```

### New Colors
```tsx
className="text-medical-blue"
className="bg-slate-100"
```

### Available Color Classes
- `text-medical-blue` - Primary color (#0066CC)
- `text-teal-secondary` - Secondary color (#00A896)
- `text-emerald-success` - Success color (#10B981)
- `text-amber-warning` - Warning color (#F59E0B)
- `text-rose-error` - Error color (#EF4444)

---

## 📝 Typography Updates

### Font Sizes
**Before:**
```tsx
className="text-xl font-bold"
```

**After:**
```tsx
className="text-3xl font-bold text-slate-900"
```

### Text Colors
**Before:**
```tsx
className="text-gray-900"
className="text-gray-600"
```

**After:**
```tsx
className="text-slate-900"
className="text-slate-600"
```

---

## 🎭 Animation Updates

### Page Transitions
**Before:**
```tsx
<div className="page">
  Content
</div>
```

**After:**
```tsx
<PageTransition>
  <div className="page">
    Content
  </div>
</PageTransition>
```

### Content Animations
**Before:**
```tsx
<div className="animate-bounce">
  Content
</div>
```

**After:**
```tsx
<SlideIn direction="up" delay={0.1}>
  <div>
    Content
  </div>
</SlideIn>
```

### Button Animations
**Before:**
```tsx
<Button className="hover:scale-105">
  Click
</Button>
```

**After:**
```tsx
<HoverScale>
  <Button>
    Click
  </Button>
</HoverScale>
```

---

## 🧩 Component Migration

### Button Component
**Before:**
```tsx
<Button variant="primary" size="lg">
  Click
</Button>
```

**After:**
```tsx
import { Button } from '@/components/ui/button-redesigned'

<Button size="lg">
  Click
</Button>
```

### Card Component
**Before:**
```tsx
<Card className="shadow-lg">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

**After:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Badge Component
**Before:**
```tsx
<Badge variant="success">Success</Badge>
```

**After:**
```tsx
import { Badge } from '@/components/ui/badge-redesigned'

<Badge variant="secondary">Success</Badge>
```

---

## 📄 Page Migration

### Step 1: Update Imports
```tsx
// Old imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BounceIn } from '@/components/animations'

// New imports
import { Button } from '@/components/ui/button-redesigned'
import { Card } from '@/components/ui/card-redesigned'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'
```

### Step 2: Update Header
```tsx
// Before
<h1 className="text-2xl font-bold text-gray-900">
  Page Title
</h1>
<p className="text-gray-600">
  Description
</p>

// After
<SlideIn direction="up" delay={0.1}>
  <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
    <Icon className="w-8 h-8 text-medical-blue" />
    Page Title
  </h1>
  <p className="text-slate-600 mt-1">
    Description
  </p>
</SlideIn>
```

### Step 3: Wrap Content
```tsx
// Before
return (
  <div className="space-y-6">
    Content
  </div>
)

// After
return (
  <PageTransition>
    <div className="space-y-6">
      Content
    </div>
  </PageTransition>
)
```

### Step 4: Update Buttons
```tsx
// Before
<Button className="hover:scale-105">
  Action
</Button>

// After
<HoverScale>
  <Button>
    Action
  </Button>
</HoverScale>
```

---

## 🚫 Removed Features

### Removed Animations
- ❌ BounceIn
- ❌ StaggerChildren
- ❌ Any non-professional animations

### Removed Color Classes
- ❌ text-blue-600
- ❌ text-gray-900
- ❌ bg-gray-100

---

## ✅ Migration Checklist

- [ ] Update all component imports to use `-redesigned` suffix
- [ ] Remove all prohibited animations (BounceIn, StaggerChildren)
- [ ] Replace old color classes with new design tokens
- [ ] Update typography to use new font sizes and colors
- [ ] Add PageTransition wrapper to all pages
- [ ] Add SlideIn to headers and important sections
- [ ] Add HoverScale to interactive elements
- [ ] Test all pages after migration
- [ ] Run accessibility tests
- [ ] Run performance tests

---

## 🧪 Testing After Migration

### Test Page
Visit `/test` to verify all components work correctly:
```tsx
http://localhost:3000/test
```

### Accessibility Test
```tsx
import { testDesignColors } from '@/lib/accessibility-test'

const results = testDesignColors()
console.log(results)
```

### Performance Test
```tsx
import { measurePageLoadTime } from '@/lib/performance-test'

const loadTime = measurePageLoadTime()
console.log(loadTime)
```

---

## 🐛 Common Migration Issues

### Issue: Animation Not Working
**Solution:**
- Check if animation component is imported correctly
- Verify animation is not in prohibited list
- Ensure parent component has proper structure

### Issue: Color Not Applied
**Solution:**
- Check if color class is correct
- Verify CSS variables are defined
- Clear browser cache

### Issue: Import Error
**Solution:**
- Ensure import path includes `-redesigned` suffix
- Check if file exists in correct location
- Restart dev server

---

## 📞 Support

If you encounter issues during migration:
1. Check this guide for solutions
2. Review component documentation
3. Check accessibility test results
4. Check performance test results
5. Contact development team

---

## 🎯 Best Practices After Migration

1. **Always use professional animations only**
   - PageTransition for pages
   - SlideIn for content
   - HoverScale for interactions

2. **Use new color tokens**
   - text-medical-blue
   - text-slate-900
   - text-slate-600

3. **Test accessibility**
   - Run color contrast tests
   - Test keyboard navigation
   - Test with screen readers

4. **Test performance**
   - Monitor page load time
   - Check bundle size
   - Test on multiple devices

5. **Keep documentation updated**
   - Document any custom components
   - Update migration guide if needed
   - Share best practices with team
