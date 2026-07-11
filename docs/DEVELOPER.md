# Developer Documentation
# توثيق المطورين

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Next.js 15
- React 19
- TypeScript

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

---

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/              # UI components
│   ├── animations/      # Animation components
│   └── accessibility/   # Accessibility components
├── lib/                  # Utility libraries
│   ├── design-tokens.ts # Design system tokens
│   ├── api-client.ts    # API client
│   └── store.ts         # State management
├── docs/                 # Documentation
└── public/              # Static assets
```

---

## 🎨 Design System

### Design Tokens
Design tokens are defined in `lib/design-tokens.ts` and include:
- Colors
- Typography
- Spacing
- Border Radius
- Shadows
- Transitions
- Z-Index
- Breakpoints

### Using Design Tokens
```tsx
import { tokens } from '@/lib/design-tokens'

// Example
const color = tokens.colors.primary[600]
```

---

## 🧩 Components

### UI Components
All UI components are located in `components/ui/` and follow the naming convention:
- `button-redesigned.tsx`
- `card-redesigned.tsx`
- `badge-redesigned.tsx`
- etc.

### Animation Components
Animation components are in `components/animations/`:
- `page-transition.tsx` - Page transitions
- `feedback-animations.tsx` - SlideIn, FadeIn
- `micro-interactions.tsx` - HoverScale, PressScale
- `loading-states.tsx` - Spinners, Skeletons

### Accessibility Components
Accessibility components are in `components/accessibility/`:
- `skip-to-content.tsx` - Skip to main content link
- `focus-trap.tsx` - Focus trap for modals
- `live-region.tsx` - ARIA live regions

---

## 🎭 Animations

### Professional Animations Only
The design system uses only professional animations:
- **PageTransition** - Smooth page transitions
- **SlideIn** - Content slide-in effects
- **HoverScale** - Micro-interactions on hover

### Using Animations
```tsx
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

<PageTransition>
  <SlideIn direction="up" delay={0.1}>
    <HoverScale>
      <Button>Click me</Button>
    </HoverScale>
  </SlideIn>
</PageTransition>
```

### Prohibited Animations
Do NOT use these animations:
- BounceIn
- StaggerChildren
- Any non-professional animations

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance
All components must meet WCAG 2.1 AA standards:
- Color contrast (4.5:1 for text, 3:1 for large text)
- Keyboard navigation
- Screen reader support
- Focus indicators
- ARIA attributes

### Testing Accessibility
Use the accessibility testing utilities:
```tsx
import { testColorContrast, testTouchTarget } from '@/lib/accessibility-test'

// Test color contrast
const result = testColorContrast('#0066CC', '#FFFFFF')
console.log(result.ratio) // Contrast ratio
console.log(result.passesAA) // WCAG AA compliance

// Test touch target
const touchResult = testTouchTarget(44, 44)
console.log(touchResult.passes) // 44x44px minimum
```

---

## 📱 Responsive Design

### Breakpoints
- xs: 0px
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

### Mobile-First Approach
Always design mobile-first:
```tsx
<div className="p-4 md:p-8 lg:p-12">
  Responsive padding
</div>
```

### Touch Targets
Minimum touch target size: 44x44px

---

## 🌍 RTL Support

### RTL Configuration
All components support RTL by default:
```tsx
<html lang="ar" dir="rtl">
```

### RTL Utilities
Use RTL-aware utilities:
```tsx
<div className="ml-4 rtl:mr-4 rtl:ml-0">
  RTL-aware margin
</div>
```

---

## 🔧 State Management

### Zustand Store
State management using Zustand:
```tsx
import { store } from '@/lib/store'

// Get user
const user = store.getUser()

// Set user
store.setUser(user)
```

### React Query
Data fetching with React Query:
```tsx
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['clinics'],
  queryFn: () => fetchClinics(),
})
```

---

## 🌐 API Integration

### API Client
Use the centralized API client:
```tsx
import { apiFetch } from '@/lib/api-client'

const response = await apiFetch('/clinics', {
  method: 'GET',
})
```

### Real-time Data
Use real-time data hooks:
```tsx
import { useRealtimeData } from '@/lib/use-realtime-data'

const { data, isLoading } = useRealtimeData(
  '/clinics/123/appointments',
  { interval: 30000 } // Poll every 30 seconds
)
```

---

## 🧪 Testing

### Component Testing
Test components at `/test`:
```tsx
import { TestComponents } from '@/components/ui/test-components'
```

### Accessibility Testing
```tsx
import { testDesignColors } from '@/lib/accessibility-test'

const results = testDesignColors()
console.log(results)
```

### Performance Testing
```tsx
import { measurePageLoadTime, measureCoreWebVitals } from '@/lib/performance-test'

const loadTime = measurePageLoadTime()
const vitals = measureCoreWebVitals()
```

---

## 🎯 Best Practices

### Code Style
- Use TypeScript
- Follow existing naming conventions
- Write clean, readable code
- Add comments for complex logic
- Use meaningful variable names

### Component Design
- Keep components small and focused
- Use composition over inheritance
- Props should be simple and clear
- Avoid prop drilling when possible
- Use hooks for reusable logic

### Performance
- Use React.memo for expensive components
- Implement code splitting
- Optimize images (WebP, AVIF)
- Use virtual scrolling for large lists
- Minimize bundle size

### Accessibility
- Always include ARIA attributes
- Test with keyboard navigation
- Ensure color contrast
- Provide focus indicators
- Support screen readers

---

## 🐛 Debugging

### Common Issues

#### Animation Not Working
- Check if animation component is imported correctly
- Verify animation is not in prohibited list
- Ensure parent component has proper structure

#### Dark Mode Not Working
- Check if ThemeProvider is in layout
- Verify CSS variables are defined
- Check localStorage for theme preference

#### Accessibility Issues
- Run accessibility tests
- Check color contrast
- Verify ARIA attributes
- Test with keyboard navigation

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🤝 Contributing

### Guidelines
1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Ensure accessibility compliance
5. Test on multiple devices

### Pull Request Process
1. Create feature branch
2. Make changes
3. Run tests
4. Update documentation
5. Submit PR for review
