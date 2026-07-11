/**
 * Accessibility Utilities
 * دوال مساعدة لتحسين إمكانية الوصول
 */

/**
 * Generates a unique ID for accessibility purposes
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Wraps a callback with keyboard event handling
 */
export function handleKeyboardEvent(
  callback: () => void,
  keys: string[] = ['Enter', ' ']
) {
  return (event: React.KeyboardEvent) => {
    if (keys.includes(event.key)) {
      event.preventDefault()
      callback()
    }
  }
}

/**
 * Checks if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableTags = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A', 'AREA']
  const isFocusableTag = focusableTags.includes(element.tagName)
  const hasTabIndex = element.hasAttribute('tabindex')
  const isDisabled = element.hasAttribute('disabled')
  const isHidden = element.getAttribute('aria-hidden') === 'true'

  return (isFocusableTag || hasTabIndex) && !isDisabled && !isHidden
}

/**
 * Traps focus within a container
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTab = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  container.addEventListener('keydown', handleTab)

  return () => {
    container.removeEventListener('keydown', handleTab)
  }
}

/**
 * Announces a message to screen readers
 */
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Creates a visually hidden but screen-reader accessible element
 */
export function createVisuallyHidden() {
  return {
    className:
      'sr-only absolute w-px h-px p-0 -m-px overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0',
  }
}

/**
 * Checks color contrast ratio (simplified version)
 */
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; passes: boolean } {
  // This is a simplified version. For production, use a proper color contrast library
  // like 'color-contrast' or implement the WCAG algorithm fully
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  const fgLuminance = 0.299 * fg.r + 0.587 * fg.g + 0.114 * fg.b
  const bgLuminance = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b

  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)

  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= 4.5, // WCAG AA standard
  }
}
