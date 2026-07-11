/**
 * Feature Flags System
 * Controls which features are enabled/disabled in the application
 * Features that are incomplete or under development should be disabled here
 */

export const FEATURE_FLAGS = {
  // Pharmacy module - incomplete, hidden for all users
  pharmacy: false,
  
  // Departments module - incomplete, hidden for all users
  departments: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureFlag);
}
