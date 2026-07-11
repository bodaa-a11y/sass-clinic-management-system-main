/**
 * Smart Booking Engine
 * ---------------------
 * PURE FUNCTIONS ONLY — zero DB imports, zero side effects.
 * All functions take plain data and return decisions.
 * The API route is responsible for DB calls and passing data here.
 *
 * Designed for easy AI scheduling integration in the future.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppointmentPriority = 'normal' | 'priority' | 'emergency';

export interface BookedAppointment {
  startTime: string; // "HH:MM"
  patientName?: string;
}

export interface AvailabilityConfig {
  startTime: string;           // "HH:MM"
  endTime: string;             // "HH:MM"
  slotDurationMinutes: number; // e.g. 15, 20, 30, 60
  bufferAfterMinutes: number;  // cleanup/prep time after each appointment
}

export interface BookingProposal {
  requestedTime: string; // "HH:MM"
  priority: AppointmentPriority;
  doctorId: string;
  date: string; // "YYYY-MM-DD"
}

/** An occupied time range [from, to) in minutes-from-midnight */
export interface TimeRange {
  from: number;
  to: number;   // startTime + slotDuration + buffer
  reason: 'booked';
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingRange?: TimeRange;
  reason?: 'buffer_overlap' | 'exact_overlap';
}

export interface SlotInfo {
  time: string;
  isAvailable: boolean;
  reason?: 'booked' | 'buffer' | 'outside_hours';
}

export interface WaitlistItem {
  id: string;
  patientName: string;
  patientPhone: string;
  preferredDate: string;
  priority: AppointmentPriority;
  createdAt: Date | string;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

type LogEvent =
  | 'BOOKING_CONFLICT'
  | 'BOOKING_SUCCESS'
  | 'EMERGENCY_FAST_TRACK'
  | 'AUTO_SUGGEST'
  | 'PRIORITY_QUEUE_BUILT';

export function structuredLog(event: LogEvent, data: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...data,
  };
  // Use stderr for structured logs so they don't pollute API response bodies
  console.error(`[BOOKING_ENGINE] ${JSON.stringify(entry)}`);
}

// ─── Time Utilities ──────────────────────────────────────────────────────────

/** "HH:MM" → minutes from midnight */
export function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/** minutes from midnight → "HH:MM" */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Core: build occupied ranges (O(n log n)) ────────────────────────────────

/**
 * Convert booked appointments into sorted TimeRange[].
 * Each range covers [startTime, startTime + slotDuration + buffer).
 * Sort once → every subsequent lookup is O(log n) binary search.
 */
export function buildOccupiedRanges(
  bookedAppointments: BookedAppointment[],
  slotDurationMinutes: number,
  bufferAfterMinutes: number
): TimeRange[] {
  const ranges: TimeRange[] = bookedAppointments.map((a) => ({
    from: parseTime(a.startTime),
    to: parseTime(a.startTime) + slotDurationMinutes + bufferAfterMinutes,
    reason: 'booked' as const,
  }));
  // Sort ascending so binary search works
  ranges.sort((a, b) => a.from - b.from);
  return ranges;
}

/**
 * Binary search: does the proposed window [slotStart, slotStart + slotDuration)
 * overlap with any occupied range?
 * O(log n) per call.
 */
function overlapsAny(
  slotStart: number,
  slotDuration: number,
  occupied: TimeRange[]
): TimeRange | null {
  const slotEnd = slotStart + slotDuration;
  let lo = 0;
  let hi = occupied.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const range = occupied[mid];

    // Overlap condition: slotStart < range.to && slotEnd > range.from
    if (slotStart < range.to && slotEnd > range.from) {
      return range;
    }
    if (range.from >= slotEnd) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return null;
}

// ─── checkConflict ───────────────────────────────────────────────────────────

/**
 * Determine whether a booking proposal conflicts with existing appointments.
 *
 * A conflict occurs when the proposed slot's window
 * [requestedTime, requestedTime + slotDuration)
 * overlaps with any occupied range (which already includes buffer).
 */
export function checkConflict(
  proposal: BookingProposal,
  occupied: TimeRange[],
  slotDurationMinutes: number
): ConflictResult {
  const slotStart = parseTime(proposal.requestedTime);
  const conflicting = overlapsAny(slotStart, slotDurationMinutes, occupied);

  if (!conflicting) {
    return { hasConflict: false };
  }

  // Distinguish buffer overlap from exact overlap for better UX messaging
  const exactEnd = slotStart + slotDurationMinutes;
  const reason =
    slotStart < conflicting.to && exactEnd > conflicting.from
      ? 'exact_overlap'
      : 'buffer_overlap';

  return {
    hasConflict: true,
    conflictingRange: conflicting,
    reason,
  };
}

// ─── generateSlots ───────────────────────────────────────────────────────────

/**
 * Generate all slots for a day, marking each as available or not.
 * Uses the pre-built occupied ranges for O(log n) per slot.
 */
export function generateSlots(
  config: AvailabilityConfig,
  occupied: TimeRange[]
): SlotInfo[] {
  const start = parseTime(config.startTime);
  const end = parseTime(config.endTime);
  const slots: SlotInfo[] = [];

  for (let current = start; current < end; current += config.slotDurationMinutes) {
    const timeStr = formatTime(current);
    const conflict = overlapsAny(current, config.slotDurationMinutes, occupied);

    if (conflict) {
      // Distinguish between slot itself being booked vs. being inside a buffer window
      const from = parseTime(timeStr);
      const isExact = occupied.some(
        (r) => r.from === from
      );
      slots.push({
        time: timeStr,
        isAvailable: false,
        reason: isExact ? 'booked' : 'buffer',
      });
    } else {
      slots.push({ time: timeStr, isAvailable: true });
    }
  }
  return slots;
}

// ─── suggestAlternativeSlots ─────────────────────────────────────────────────

/**
 * Find up to `count` available slots on the same day, after the requested time
 * (or from the start if none found after, we scan the whole day).
 *
 * For emergency priority → always returns slots starting from the
 * very first available in the day, ignoring the "tomorrow minimum" rule.
 * For normal/priority → searches from requestedTime onward first.
 */
export function suggestAlternativeSlots(
  proposal: BookingProposal,
  config: AvailabilityConfig,
  occupied: TimeRange[],
  count = 3
): string[] {
  const allSlots = generateSlots(config, occupied);
  const available = allSlots.filter((s) => s.isAvailable).map((s) => s.time);

  if (available.length === 0) return [];

  if (proposal.priority === 'emergency') {
    // Emergency: start from the very first slot (even same-day)
    structuredLog('EMERGENCY_FAST_TRACK', {
      doctorId: proposal.doctorId,
      date: proposal.date,
      availableSlots: available.slice(0, count),
    });
    return available.slice(0, count);
  }

  // For normal/priority: prefer slots after the requested time
  const requestedMinutes = parseTime(proposal.requestedTime);
  const after = available.filter((t) => parseTime(t) > requestedMinutes);
  const before = available.filter((t) => parseTime(t) <= requestedMinutes);

  // Return slots after first, then wrap around to slots before if needed
  const suggestions = [...after, ...before].slice(0, count);

  structuredLog('AUTO_SUGGEST', {
    doctorId: proposal.doctorId,
    date: proposal.date,
    requestedTime: proposal.requestedTime,
    suggestedSlots: suggestions,
  });

  return suggestions;
}

// ─── findNextAvailableDate ───────────────────────────────────────────────────

/**
 * Given that a day is fully booked, describe the search context for finding
 * the next available date. The actual DB query runs in the API route;
 * this helper just computes the candidate date list (next N days).
 */
export function getNextCandidateDates(fromDate: string, days = 7): string[] {
  const result: string[] = [];
  const base = new Date(fromDate);
  for (let i = 1; i <= days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

// ─── getPriorityQueue ────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<AppointmentPriority, number> = {
  emergency: 0,
  priority: 1,
  normal: 2,
};

/**
 * Sort waitlist items by:
 * 1. Priority level (emergency → priority → normal)
 * 2. Within same level: earliest preferredDate first
 * 3. Tie-break: createdAt ascending (FIFO)
 *
 * Pure sort — no mutation of original array.
 */
export function getPriorityQueue<T extends WaitlistItem>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;

    const dateDiff =
      new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime();
    if (dateDiff !== 0) return dateDiff;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  structuredLog('PRIORITY_QUEUE_BUILT', {
    total: sorted.length,
    emergency: sorted.filter((i) => i.priority === 'emergency').length,
    priority: sorted.filter((i) => i.priority === 'priority').length,
    normal: sorted.filter((i) => i.priority === 'normal').length,
  });

  return sorted;
}
