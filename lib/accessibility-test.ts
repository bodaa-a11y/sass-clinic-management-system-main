/**
 * Accessibility Testing Utilities
 * أدوات اختبار إمكانية الوصول
 */

// اختبار ألوان التباين (Color Contrast Test)
export function testColorContrast(foreground: string, background: string): {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
} {
  // تحويل HEX إلى RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  if (!fg || !bg) {
    return { ratio: 0, passesAA: false, passesAAA: false }
  }

  // حساب نسبة التباين
  const luminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map((v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
  }

  const lum1 = luminance(fg.r, fg.g, fg.b)
  const lum2 = luminance(bg.r, bg.g, bg.b)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  const ratio = (brightest + 0.05) / (darkest + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
  }
}

// اختبار حجم النص (Font Size Test)
export function testFontSize(fontSize: string, isBold: boolean = false): {
  passesAA: boolean
  passesAAA: boolean
} {
  const size = parseInt(fontSize)
  const sizeInPx = size || 16

  // WCAG 2.1 AA: 18px (14pt) or 14px bold (11pt bold)
  const passesAA = sizeInPx >= 18 || (isBold && sizeInPx >= 14)
  // WCAG 2.1 AAA: 24px (18pt) or 18.66px bold (14pt bold)
  const passesAAA = sizeInPx >= 24 || (isBold && sizeInPx >= 18.66)

  return { passesAA, passesAAA }
}

// اختبار مسافة النقر (Touch Target Test)
export function testTouchTarget(width: number, height: number): {
  passes: boolean
  recommendation: string
} {
  const minSize = 44 // WCAG 2.5.5: 44x44 CSS pixels
  const passes = width >= minSize && height >= minSize

  return {
    passes,
    recommendation: passes
      ? 'Touch target size is adequate'
      : `Touch target should be at least ${minSize}x${minSize}px. Current: ${width}x${height}px`,
  }
}

// اختبار التركيز (Focus Test)
export function testFocusableElements(): {
  count: number
  hasFocusStyles: boolean
} {
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const hasFocusStyles = document.querySelectorAll(':focus-visible').length > 0

  return {
    count: focusableElements.length,
    hasFocusStyles,
  }
}

// اختبار الألوان المستخدمة في التصميم
export const testDesignColors = () => {
  const tests = [
    // Medical Blue on White
    testColorContrast('#0066CC', '#FFFFFF'),
    // Teal on White
    testColorContrast('#00A896', '#FFFFFF'),
    // Emerald on White
    testColorContrast('#10B981', '#FFFFFF'),
    // Slate 900 on White
    testColorContrast('#0F172A', '#FFFFFF'),
    // Slate 600 on White
    testColorContrast('#475569', '#FFFFFF'),
  ]

  return tests.map((test, index) => ({
    name: ['Medical Blue', 'Teal', 'Emerald', 'Slate 900', 'Slate 600'][index],
    ...test,
  }))
}
