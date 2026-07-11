/**
 * Theme Configuration - منصة إدارة العيادات
 * يستخدم design-tokens مع Tailwind CSS
 */

import { tokens } from './design-tokens'

export const theme = {
  extend: {
    colors: {
      // Primary Colors
      primary: tokens.colors.primary,
      // Secondary Colors
      secondary: tokens.colors.secondary,
      // Accent Colors
      accent: tokens.colors.accent,
      // Neutral Colors
      neutral: tokens.colors.neutral,
      // Semantic Colors
      success: tokens.colors.success,
      warning: tokens.colors.warning,
      error: tokens.colors.error,
      info: tokens.colors.info,
    },
    fontFamily: {
      sans: tokens.typography.fontFamily.sans,
      arabic: tokens.typography.fontFamily.arabic,
    },
    fontSize: tokens.typography.fontSize,
    fontWeight: tokens.typography.fontWeight,
    spacing: tokens.spacing,
    borderRadius: tokens.borderRadius,
    boxShadow: tokens.shadows,
    transitionDuration: tokens.transitions.duration,
    transitionTimingFunction: tokens.transitions.easing,
    zIndex: tokens.zIndex,
    screens: tokens.breakpoints,
  },
}

export default theme
