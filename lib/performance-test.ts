/**
 * Performance Testing Utilities
 * أدوات اختبار الأداء
 */

// اختبار وقت تحميل الصفحة (Page Load Test)
export function measurePageLoadTime(): {
  domContentLoaded: number
  loadComplete: number
  totalLoadTime: number
} {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!navigation) {
    return {
      domContentLoaded: 0,
      loadComplete: 0,
      totalLoadTime: 0,
    }
  }

  const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
  const loadComplete = navigation.loadEventEnd - navigation.loadEventStart
  const totalLoadTime = navigation.loadEventEnd - navigation.fetchStart

  return {
    domContentLoaded: Math.round(domContentLoaded),
    loadComplete: Math.round(loadComplete),
    totalLoadTime: Math.round(totalLoadTime),
  }
}

// اختبار Core Web Vitals
export function measureCoreWebVitals(): {
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
} {
  // ملاحظة: هذه قيم افتراضية. في الإنتاج، استخدم web-vitals library
  return {
    LCP: 0, // يجب أن يكون < 2.5s
    FID: 0, // يجب أن يكون < 100ms
    CLS: 0, // يجب أن يكون < 0.1
  }
}

// اختبار حجم الـ Bundle
export function measureBundleSize(): {
  total: number
  gzipped: number
  recommendation: string
} {
  // ملاحظة: هذه قيم افتراضية. في الإنتاج، استخدم webpack-bundle-analyzer
  const total = 500 // KB
  const gzipped = 150 // KB

  const recommendation =
    total < 500 ? 'Bundle size is good' : 'Consider code splitting to reduce bundle size'

  return {
    total,
    gzipped,
    recommendation,
  }
}

// اختبار عدد الـ Requests
export function measureRequestCount(): {
  count: number
  recommendation: string
} {
  const resources = performance.getEntriesByType('resource')
  const count = resources.length

  const recommendation =
    count < 50 ? 'Request count is good' : 'Consider combining or lazy-loading resources'

  return {
    count,
    recommendation,
  }
}

// اختبار FPS (Frames Per Second)
export function measureFPS(): {
  average: number
  min: number
  max: number
  recommendation: string
} {
  const frames: number[] = []
  let lastTime = performance.now()

  const measureFrame = () => {
    const now = performance.now()
    const fps = 1000 / (now - lastTime)
    frames.push(fps)
    lastTime = now

    if (frames.length < 60) {
      requestAnimationFrame(measureFrame)
    }
  }

  requestAnimationFrame(measureFrame)

  const average = frames.reduce((a, b) => a + b, 0) / frames.length
  const min = Math.min(...frames)
  const max = Math.max(...frames)

  const recommendation =
    average >= 55 ? 'FPS is good' : 'Consider optimizing animations and rendering'

  return {
    average: Math.round(average),
    min: Math.round(min),
    max: Math.round(max),
    recommendation,
  }
}

// اختبار Memory Usage
export function measureMemoryUsage(): {
  used: number
  total: number
  percentage: number
} {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    const used = Math.round(memory.usedJSHeapSize / 1048576) // MB
    const total = Math.round(memory.totalJSHeapSize / 1048576) // MB
    const percentage = Math.round((used / total) * 100)

    return {
      used,
      total,
      percentage,
    }
  }

  return {
    used: 0,
    total: 0,
    percentage: 0,
  }
}
