/**
 * Recurring Appointment Utilities
 * Handles calculation of recurring appointment dates
 */

export type RecurringPattern = 'daily' | 'weekly' | 'monthly';

export interface RecurringDate {
  date: string;
  index: number;
}

/**
 * Calculate all recurring dates based on pattern and count
 * @param startDate - Starting date (YYYY-MM-DD)
 * @param pattern - Recurring pattern
 * @param count - Number of repetitions
 * @returns Array of dates including the start date
 */
export function calculateRecurringDates(
  startDate: string,
  pattern: RecurringPattern,
  count: number
): RecurringDate[] {
  const dates: RecurringDate[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(start);

    switch (pattern) {
      case 'daily':
        date.setDate(date.getDate() + i);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (i * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + i);
        break;
    }

    dates.push({
      date: date.toISOString().split('T')[0],
      index: i,
    });
  }

  return dates;
}

/**
 * Calculate end date based on start date, pattern, and count
 * @param startDate - Starting date (YYYY-MM-DD)
 * @param pattern - Recurring pattern
 * @param count - Number of repetitions
 * @returns End date (YYYY-MM-DD)
 */
export function calculateRecurringEndDate(
  startDate: string,
  pattern: RecurringPattern,
  count: number
): string {
  const dates = calculateRecurringDates(startDate, pattern, count);
  return dates[dates.length - 1].date;
}

/**
 * Validate recurring appointment parameters
 * @param pattern - Recurring pattern
 * @param count - Number of repetitions
 * @returns Validation result
 */
export function validateRecurringParams(
  pattern: string,
  count: number
): { valid: boolean; error?: string } {
  const validPatterns = ['daily', 'weekly', 'monthly'];

  if (!validPatterns.includes(pattern)) {
    return {
      valid: false,
      error: 'Invalid recurring pattern. Must be daily, weekly, or monthly.',
    };
  }

  if (count < 1 || count > 52) {
    return {
      valid: false,
      error: 'Recurring count must be between 1 and 52.',
    };
  }

  return { valid: true };
}
