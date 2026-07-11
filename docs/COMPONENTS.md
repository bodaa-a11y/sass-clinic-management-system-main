# Component Documentation
# توثيق المكونات

## 📚 Table of Contents
- [Button](#button)
- [Card](#card)
- [Badge](#badge)
- [Input](#input)
- [Tabs](#tabs)
- [Glass Card](#glass-card)
- [Typography](#typography)
- [Bento Grid](#bento-grid)
- [Contextual Transition](#contextual-transition)
- [Enhanced Micro-interactions](#enhanced-micro-interactions)
- [AI Bubble](#ai-bubble)
- [Predictive Highlight](#predictive-highlight)
- [AI Status](#ai-status)

---

## Button

### Usage
```tsx
import { Button } from '@/components/ui/button-redesigned'

<Button>Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'default' \| 'outline' \| 'ghost' | 'default' | Button style variant |
| size | 'default' \| 'sm' \| 'lg' \| 'icon' | 'default' | Button size |
| disabled | boolean | false | Disable the button |

### Accessibility
- Supports keyboard navigation
- Includes focus states
- Screen reader friendly

---

## Card

### Usage
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | '' | Additional CSS classes |

### Accessibility
- Semantic HTML structure
- Proper heading hierarchy
- Screen reader friendly

---

## Badge

### Usage
```tsx
import { Badge } from '@/components/ui/badge-redesigned'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'default' \| 'secondary' \| 'destructive' | 'default' | Badge style variant |

### Accessibility
- Screen reader friendly
- Proper color contrast

---

## Input

### Usage
```tsx
import { Input } from '@/components/ui/input-redesigned'

<Input placeholder="Enter text..." />
<Input disabled />
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | string | 'text' | Input type |
| placeholder | string | '' | Placeholder text |
| disabled | boolean | false | Disable the input |

### Accessibility
- Proper labels required
- Focus states
- Error states support

---

## Tabs

### Usage
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-redesigned'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| defaultValue | string | '' | Default active tab |

### Accessibility
- Keyboard navigation
- ARIA attributes
- Screen reader friendly

---

## Design Tokens

### Colors
- **Medical Blue:** #0066CC
- **Teal Secondary:** #00A896
- **Emerald Success:** #10B981
- **Amber Warning:** #F59E0B
- **Rose Error:** #EF4444

### Typography
- **Font Family:** Inter, Tajawal (Arabic)
- **Font Sizes:** 12px - 48px
- **Font Weights:** 300 - 700

### Spacing
- **Scale:** 4px - 96px
- **Base Unit:** 4px

### Border Radius
- **None:** 0px
- **Sm:** 4px
- **Base:** 8px
- **Md:** 12px
- **Lg:** 16px
- **Xl:** 24px
- **2xl:** 32px
- **Full:** 9999px

### Shadows
- **None:** none
- **Xs:** 0 1px 2px rgba(0, 0, 0, 0.05)
- **Sm:** 0 2px 4px rgba(0, 0, 0, 0.1)
- **Base:** 0 4px 6px rgba(0, 0, 0, 0.1)
- **Md:** 0 4px 8px rgba(0, 0, 0, 0.12)
- **Lg:** 0 8px 16px rgba(0, 0, 0, 0.15)
- **Xl:** 0 16px 32px rgba(0, 0, 0, 0.2)
- **2xl:** 0 24px 48px rgba(0, 0, 0, 0.25)

---

## Animations

### PageTransition
```tsx
import { PageTransition } from '@/components/animations/page-transition'

<PageTransition>
  <div>Page content</div>
</PageTransition>
```

### SlideIn
```tsx
import { SlideIn } from '@/components/animations/feedback-animations'

<SlideIn direction="up" delay={0.1}>
  <div>Content</div>
</SlideIn>
```

### HoverScale
```tsx
import { HoverScale } from '@/components/animations/micro-interactions'

<HoverScale>
  <Button>Hover me</Button>
</HoverScale>
```

---

## Accessibility Features

### Keyboard Navigation
- Tab navigation
- Enter/Space for buttons
- Arrow keys for tabs

### Screen Reader Support
- ARIA labels
- Semantic HTML
- Focus management

### Visual Accessibility
- Color contrast (WCAG AA)
- Focus indicators
- Reduced motion support

---

## Responsive Breakpoints

| Breakpoint | Size | Usage |
|------------|------|-------|
| xs | 0px | Mobile portrait |
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |
| 2xl | 1536px | Extra large desktop |

---

## Best Practices

1. **Always use semantic HTML**
2. **Include proper ARIA attributes**
3. **Test with keyboard navigation**
4. **Ensure color contrast compliance**
5. **Use responsive design**
6. **Test on multiple devices**
7. **Optimize images**
8. **Minimize bundle size**

---

## Glass Card

### Usage
```tsx
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'

<GlassCard variant="light" blur="md">
  <GlassCardHeader>
    <GlassCardTitle>Glass Card</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    Content with glassmorphism effect
  </GlassCardContent>
</GlassCard>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'light' \| 'dark' \| 'accent' | 'light' | Glass variant |
| blur | 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Blur intensity |

### Accessibility
- Semantic HTML structure
- Proper heading hierarchy
- Screen reader friendly

---

## Typography

### Usage
```tsx
import { DisplayText, Heading, BodyText, Caption, MedicalData } from '@/components/ui/typography'

<DisplayText size="large" weight="bold">
  Large Display Text
</DisplayText>

<Heading level={2} weight="semibold">
  Heading Text
</Heading>

<BodyText size="md" color="default">
  Body text content
</BodyText>

<MedicalData
  value="120/80"
  label="ضغط الدم"
  variant="default"
  size="md"
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | varies | varies | Component-specific size |
| weight | varies | varies | Font weight |
| color | varies | varies | Text color |
| variant | varies | varies | Component-specific variant |

### Accessibility
- Proper heading hierarchy
- Color contrast compliant
- Screen reader friendly

---

## Bento Grid

### Usage
```tsx
import { ResponsiveBentoGrid } from '@/components/layout/bento-grid'

<ResponsiveBentoGrid
  items={[
    {
      id: '1',
      content: <div>Small item</div>,
      size: 'small',
    },
    {
      id: '2',
      content: <div>Medium item</div>,
      size: 'medium',
    },
    {
      id: '3',
      content: <div>Large item</div>,
      size: 'large',
    },
  ]}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | BentoGridItem[] | required | Grid items |
| gap | number | 4 | Gap between items |

### BentoGridItem Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | 'small' \| 'medium' \| 'large' \| 'wide' \| 'tall' | 'small' | Item size |
| colSpan | number | undefined | Column span |
| rowSpan | number | undefined | Row span |

### Accessibility
- Semantic grid structure
- Responsive design
- Screen reader friendly

---

## Contextual Transition

### Usage
```tsx
import { ContextualTransition, CardExpansion } from '@/components/animations/contextual-transition'

<ContextualTransition
  isExpanded={isExpanded}
  onExpand={() => setIsExpanded(true)}
  onCollapse={() => setIsExpanded(false)}
>
  <Card>Content</Card>
</ContextualTransition>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isExpanded | boolean | required | Expansion state |
| onExpand | () => void | undefined | Expand callback |
| onCollapse | () => void | undefined | Collapse callback |
| expandedContent | ReactNode | undefined | Expanded content |

### Accessibility
- Keyboard navigation
- Focus management
- ARIA attributes

---

## Enhanced Micro-interactions

### Usage
```tsx
import { MagneticButton, PressFeedback, TiltEffect } from '@/components/animations/enhanced-micro'

<MagneticButton strength={20}>
  <Button>Magnetic Button</Button>
</MagneticButton>

<PressFeedback onClick={handleClick}>
  <Button>Press Feedback</Button>
</PressFeedback>

<TiltEffect maxRotate={5}>
  <Card>Tilt Effect</Card>
</TiltEffect>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| strength | number | 20 | Magnetic strength |
| maxRotate | number | 5 | Tilt rotation |

### Accessibility
- Keyboard navigation
- Reduced motion support
- Performance optimized

---

## AI Bubble

### Usage
```tsx
import { AIBubble, AIStatus } from '@/components/ai/ai-bubble'

<AIBubble state="listening" size="md" />

<AIStatus status="active" message="AI is ready" />
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| state | 'idle' \| 'listening' \| 'processing' \| 'speaking' | required | AI state |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Bubble size |
| status | 'active' \| 'inactive' \| 'error' | required | Status type |
| message | string | undefined | Status message |

### Accessibility
- ARIA live regions
- Screen reader announcements
- Visual feedback

---

## Predictive Highlight

### Usage
```tsx
import { PredictiveHighlight, AnomalyHighlight } from '@/components/ai/predictive-highlight'

<PredictiveHighlight variant="alert" intensity="high">
  <div>Abnormal value</div>
</PredictiveHighlight>

<AnomalyHighlight
  value="150/90"
  threshold="120/80"
  isAnomaly={true}
  label="ضغط الدم"
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'warning' \| 'alert' \| 'info' \| 'success' | 'warning' | Highlight variant |
| intensity | 'low' \| 'medium' \| 'high' | 'medium' | Highlight intensity |
| showIcon | boolean | true | Show icon |
| isAnomaly | boolean | required | Is value abnormal |

### Accessibility
- Color contrast compliant
- Screen reader friendly
- Visual hierarchy

---

## AI Status

### Usage
```tsx
import { AIStatus, AIProgress } from '@/components/ai/ai-status'

<AIStatus status="processing" message="Analyzing data..." compact />

<AIProgress progress={75} status="Processing..." />
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| status | 'idle' \| 'listening' \| 'processing' \| 'speaking' \| 'success' \| 'error' | required | AI status |
| compact | boolean | false | Compact mode |
| progress | number | required | Progress percentage |

### Accessibility
- ARIA live regions
- Screen reader announcements
- Visual feedback
