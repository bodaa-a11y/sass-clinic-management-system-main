/**
 * Design Tokens - منصة إدارة العيادات
 * مستوحى من Oracle Health و Healthie
 */

export const tokens = {
  // Colors - نظام الألوان المحسّن
  colors: {
    // Primary Colors
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#0066CC', // Medical Blue - Oracle Health inspired
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
    },
    // Secondary Colors
    secondary: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#00A896', // Teal - Healthie inspired
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
      950: '#042F2E',
    },
    // Accent Colors
    accent: {
      50: '#FFF1F2',
      100: '#FFE4E6',
      200: '#FECDD3',
      300: '#FDA4AF',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#FF6B6B', // Coral - for important actions
      700: '#E11D48',
      800: '#BE123C',
      900: '#9F1239',
      950: '#881337',
    },
    // Neutral Colors
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B', // Slate Gray - for secondary text
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    // Semantic Colors
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981', // Emerald
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Amber
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444', // Rose
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
  },

  // Dark Mode Colors - نظام ألوان الوضع الليلي
  dark: {
    // Background colors
    background: {
      DEFAULT: '#0F172A', // Slate 900
      paper: '#1E293B', // Slate 800
      elevated: '#334155', // Slate 700
    },
    // Text colors
    text: {
      primary: '#F1F5F9', // Slate 100
      secondary: '#CBD5E1', // Slate 300
      tertiary: '#94A3B8', // Slate 400
      disabled: '#64748B', // Slate 500
    },
    // Border colors
    border: {
      DEFAULT: '#334155', // Slate 700
      hover: '#475569', // Slate 600
      focus: '#0066CC', // Medical Blue
    },
    // Card colors
    card: {
      DEFAULT: '#1E293B', // Slate 800
      hover: '#334155', // Slate 700
      active: '#475569', // Slate 600
    },
    // Input colors
    input: {
      DEFAULT: '#1E293B', // Slate 800
      border: '#334155', // Slate 700
      focus: '#0066CC', // Medical Blue
    },
    // Button colors
    button: {
      DEFAULT: '#0066CC', // Medical Blue
      hover: '#1D4ED8', // Blue 700
      active: '#1E40AF', // Blue 800
      disabled: '#64748B', // Slate 500
    },
  },

  // Typography - نظام الخطوط
  typography: {
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      arabic: 'Tajawal, Cairo, "Segoe UI", Roboto, sans-serif',
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px', fontWeight: 500 }],
      sm: ['14px', { lineHeight: '20px', fontWeight: 400 }],
      base: ['16px', { lineHeight: '24px', fontWeight: 400 }],
      lg: ['18px', { lineHeight: '28px', fontWeight: 400 }],
      xl: ['20px', { lineHeight: '28px', fontWeight: 600 }],
      '2xl': ['24px', { lineHeight: '32px', fontWeight: 600 }],
      '3xl': ['30px', { lineHeight: '40px', fontWeight: 700 }],
      '4xl': ['36px', { lineHeight: '44px', fontWeight: 700 }],
      '5xl': ['48px', { lineHeight: '56px', fontWeight: 700 }],
      '6xl': ['60px', { lineHeight: '72px', fontWeight: 700 }],
      '7xl': ['72px', { lineHeight: '80px', fontWeight: 700 }],
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },

  // Spacing - نظام المسافات
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // Border Radius - نظام الزوايا
  borderRadius: {
    none: '0px',
    sm: '4px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    full: '9999px',
  },

  // Shadows - نظام الظلال
  shadows: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    base: '0 4px 6px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.2)',
    '2xl': '0 24px 48px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },

  // Transitions - نظام الحركات
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-Index - نظام الطبقات
  zIndex: {
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },

  // Breakpoints - نقاط التوقف
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Glassmorphism - تأثير الزجاجيّة
  glassmorphism: {
    blur: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
    },
    opacity: {
      light: 0.8,
      dark: 0.9,
      accent: 0.1,
    },
    border: {
      light: 'rgba(255, 255, 255, 0.2)',
      dark: 'rgba(255, 255, 255, 0.1)',
      accent: 'rgba(0, 102, 204, 0.2)',
    },
  },

  // Bento Grid - شبكات البينتو
  bento: {
    spacing: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    sizes: {
      small: { col: 1, row: 1 },
      medium: { col: 2, row: 1 },
      large: { col: 2, row: 2 },
      wide: { col: 3, row: 1 },
      tall: { col: 1, row: 2 },
    },
    borderRadius: '1rem',
  },

  // Layout - نظام التخطيط المحسّن
  layout: {
    container: {
      maxWidth: '1280px', // max-w-7xl
      padding: {
        x: '1.5rem', // px-6
        y: '2rem', // py-8
      },
    },
    section: {
      gap: '3rem', // space-y-12
      marginBottom: '3rem', // mb-12
    },
    card: {
      gap: '1.5rem', // gap-6
      padding: '1.5rem', // p-6
      minHeight: {
        small: '8.75rem', // min-h-[140px]
        medium: '10rem', // min-h-[160px]
        large: '12.5rem', // min-h-[200px]
        tall: '25rem', // min-h-[400px]
      },
      borderRadius: '0.75rem', // rounded-xl
    },
    header: {
      spacing: {
        title: '0.5rem', // space-y-2
        subtitle: '0.25rem', // space-y-1
      },
    },
  },

  // Typography Hierarchy - التسلسل الهرمي للخطوط
  hierarchy: {
    page: {
      title: '2.25rem', // text-4xl (36px)
      subtitle: '1rem', // text-base (16px)
    },
    section: {
      title: '1.5rem', // text-2xl (24px)
      subtitle: '0.875rem', // text-sm (14px)
    },
    card: {
      title: '1.125rem', // text-lg (18px)
      subtitle: '0.875rem', // text-sm (14px)
    },
  },

  // Micro-interactions - التفاعلات الدقيقة المحسّنة
  microInteractions: {
    hoverScale: {
      subtle: 1.02, // scale-[1.02]
      moderate: 1.03, // scale-[1.03]
      strong: 1.05, // scale-[1.05]
    },
    transition: {
      duration: '200ms', // duration-200
    },
  },
}

export type Tokens = typeof tokens
