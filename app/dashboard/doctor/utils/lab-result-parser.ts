/**
 * Parse lab result and determine if it's abnormal
 * @param result - The result value (e.g., "150", "120/80")
 * @param normalRange - The normal range (e.g., "70-120", "120/80")
 * @returns true if result is outside normal range
 */
export const isResultAbnormal = (result: string, normalRange?: string): boolean => {
  if (!normalRange) return false

  // Parse numeric values from result and range
  const resultValue = parseFloat(result)
  if (isNaN(resultValue)) return false

  // Parse range (e.g., "70-120" or "120/80")
  if (normalRange.includes('-')) {
    const [min, max] = normalRange.split('-').map(v => parseFloat(v.trim()))
    if (!isNaN(min) && !isNaN(max)) {
      return resultValue < min || resultValue > max
    }
  } else if (normalRange.includes('/')) {
    // Handle blood pressure format
    const parts = result.split('/').map(v => parseFloat(v.trim()))
    const rangeParts = normalRange.split('/').map(v => parseFloat(v.trim()))
    if (parts.length === 2 && rangeParts.length === 2) {
      return parts[0] < rangeParts[0] || parts[1] > rangeParts[1]
    }
  }

  return false
}

/**
 * Get severity level for abnormal result
 * @param result - The result value
 * @param normalRange - The normal range
 * @returns 'critical', 'warning', or 'normal'
 */
export const getResultSeverity = (result: string, normalRange?: string): 'critical' | 'warning' | 'normal' => {
  if (!normalRange) return 'normal'
  if (!isResultAbnormal(result, normalRange)) return 'normal'

  const resultValue = parseFloat(result)
  const [min, max] = normalRange.includes('-')
    ? normalRange.split('-').map(v => parseFloat(v.trim()))
    : [0, 0]

  if (isNaN(min) || isNaN(max)) return 'warning'

  // Critical if result is significantly outside range (more than 50% deviation)
  const deviation = Math.abs(resultValue - ((min + max) / 2))
  const rangeSize = max - min
  if (deviation > rangeSize * 0.5) return 'critical'

  return 'warning'
}

/**
 * Format result with unit and color indicator
 * @param result - The result value
 * @param normalRange - The normal range
 * @param unit - Optional unit (e.g., "mg/dL")
 * @returns formatted result with styling info
 */
export const formatLabResult = (
  result: string,
  normalRange?: string,
  unit?: string
): { value: string; isAbnormal: boolean; severity: 'critical' | 'warning' | 'normal' } => {
  const isAbnormalResult = isResultAbnormal(result, normalRange)
  const severity = getResultSeverity(result, normalRange)

  return {
    value: unit ? `${result} ${unit}` : result,
    isAbnormal: isAbnormalResult,
    severity,
  }
}
