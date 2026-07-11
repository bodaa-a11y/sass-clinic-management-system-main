/**
 * Auto-Scheduling Engine
 * ----------------------
 * Automatically suggests appointments for patients based on availability,
 * urgency, wait time, and preferences.
 * 
 * Features:
 * - Multi-criteria ranking (urgency, wait time, doctor preference)
 * - Preference matching algorithm
 * - Intelligent slot scoring
 * - Priority-based scheduling
 */

import type { AppointmentPriority } from './booking-engine';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PatientPreferences {
  preferredDoctors?: string[];     // Doctor IDs in priority order
  preferredTimeRange?: {           // e.g., morning, afternoon, evening
    start: string;                 // "HH:MM"
    end: string;                   // "HH:MM"
  };
  avoidDays?: number[];            // 0=Sunday, 6=Saturday
  maxWaitDays?: number;            // Maximum days to wait
  flexibleWithTime?: boolean;      // Can accept nearby times
}

export interface AutoScheduleRequest {
  patientId: string;
  priority: AppointmentPriority;
  preferences?: PatientPreferences;
  excludeDates?: string[];         // Dates to exclude
}

export interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  specialtyId?: string;
  date: string;
  availableSlots: string[];        // ["09:00", "09:30", ...]
  config: {
    slotDurationMinutes: number;
  };
}

export interface ScoredSlot {
  doctorId: string;
  doctorName: string;
  specialtyId?: string;
  date: string;
  time: string;
  score: number;                   // 0-100
  reasons: string[];                 // Why this slot was suggested
}

export interface AutoScheduleResult {
  suggestions: ScoredSlot[];
  totalOptions: number;
  bestMatch: ScoredSlot | null;
  alternativeDates: string[];
  waitlistRecommended: boolean;
}

// ─── Scoring Weights ───────────────────────────────────────────────────────

const WEIGHTS = {
  URGENCY_BOOST: 30,           // Emergency gets +30 points
  PREFERRED_DOCTOR: 25,      // Preferred doctor match
  TIME_PREFERENCE: 20,         // Within preferred time range
  SHORT_WAIT: 15,              // Soon availability
  FLEXIBILITY_BONUS: 10,       // Nearby times if flexible
  DOCTOR_AVAILABILITY: 5,      // More slots = better
};

// ─── Helper Functions ──────────────────────────────────────────────────────

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function isWithinTimeRange(time: string, range: { start: string; end: string }): boolean {
  const timeMinutes = parseTime(time);
  const startMinutes = parseTime(range.start);
  const endMinutes = parseTime(range.end);
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ─── Scoring Algorithm ─────────────────────────────────────────────────────

/**
 * Calculate score for a specific slot based on multiple criteria
 */
function scoreSlot(
  slot: {
    doctorId: string;
    doctorName: string;
    specialtyId?: string;
    date: string;
    time: string;
  },
  request: AutoScheduleRequest,
  allSlots: DoctorAvailability[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const { priority, preferences } = request;

  // 1. Urgency boost
  if (priority === 'emergency') {
    score += WEIGHTS.URGENCY_BOOST;
    reasons.push('🚨 أولوية طارئة');
  } else if (priority === 'priority') {
    score += WEIGHTS.URGENCY_BOOST / 2;
    reasons.push('⚡ أولوية مرتفعة');
  }

  // 2. Preferred doctor match
  if (preferences?.preferredDoctors?.includes(slot.doctorId)) {
    score += WEIGHTS.PREFERRED_DOCTOR;
    const rank = preferences.preferredDoctors.indexOf(slot.doctorId);
    if (rank === 0) {
      reasons.push('👨‍⚕️ الطبيب المفضل الأول');
    } else {
      reasons.push(`👨‍⚕️ طبيب مفضل (${rank + 1})`);
    }
  }

  // 3. Time preference match
  if (preferences?.preferredTimeRange) {
    if (isWithinTimeRange(slot.time, preferences.preferredTimeRange)) {
      score += WEIGHTS.TIME_PREFERENCE;
      reasons.push('⏰ في نطاق الوقت المفضل');
    } else if (preferences.flexibleWithTime) {
      // Partial credit for nearby times
      const slotMinutes = parseTime(slot.time);
      const rangeStart = parseTime(preferences.preferredTimeRange.start);
      const rangeEnd = parseTime(preferences.preferredTimeRange.end);
      const bufferMinutes = 30; // 30 minute buffer
      
      if (slotMinutes >= rangeStart - bufferMinutes && slotMinutes <= rangeEnd + bufferMinutes) {
        score += WEIGHTS.FLEXIBILITY_BONUS;
        reasons.push('⏰ قريب من الوقت المفضل');
      }
    }
  }

  // 4. Short wait bonus
  const waitDays = daysFromNow(slot.date);
  if (waitDays <= 1) {
    score += WEIGHTS.SHORT_WAIT;
    reasons.push('📅 متاح اليوم/غداً');
  } else if (waitDays <= 3) {
    score += WEIGHTS.SHORT_WAIT / 2;
    reasons.push('📅 متاح هذا الأسبوع');
  }

  // 5. Doctor availability bonus (prefer doctors with more open slots)
  const doctorSlots = allSlots.find(d => d.doctorId === slot.doctorId);
  if (doctorSlots && doctorSlots.availableSlots.length > 5) {
    score += WEIGHTS.DOCTOR_AVAILABILITY;
    reasons.push('✅ طبيب متاح بكثرة');
  }

  return { score, reasons };
}

// ─── Main Algorithm ────────────────────────────────────────────────────────

/**
 * Find the best appointment suggestions based on patient preferences
 */
export function findBestAppointments(
  request: AutoScheduleRequest,
  availabilities: DoctorAvailability[]
): AutoScheduleResult {
  const scoredSlots: ScoredSlot[] = [];
  const { preferences } = request;

  // Filter out excluded dates and days
  const filteredAvailabilities = availabilities.filter(avail => {
    // Exclude specific dates
    if (request.excludeDates?.includes(avail.date)) {
      return false;
    }
    
    // Exclude preferred days off
    if (preferences?.avoidDays?.includes(getDayOfWeek(avail.date))) {
      return false;
    }
    
    // Check max wait constraint
    if (preferences?.maxWaitDays) {
      const waitDays = daysFromNow(avail.date);
      if (waitDays > preferences.maxWaitDays) {
        return false;
      }
    }
    
    return true;
  });

  // Score all available slots
  for (const avail of filteredAvailabilities) {
    for (const time of avail.availableSlots) {
      const { score, reasons } = scoreSlot(
        {
          doctorId: avail.doctorId,
          doctorName: avail.doctorName,
          specialtyId: avail.specialtyId,
          date: avail.date,
          time,
        },
        request,
        filteredAvailabilities
      );

      scoredSlots.push({
        doctorId: avail.doctorId,
        doctorName: avail.doctorName,
        specialtyId: avail.specialtyId,
        date: avail.date,
        time,
        score,
        reasons,
      });
    }
  }

  // Sort by score (descending)
  scoredSlots.sort((a, b) => b.score - a.score);

  // Determine if waitlist is recommended
  const waitlistRecommended = scoredSlots.length === 0 || 
    (request.priority === 'normal' && scoredSlots.length < 3);

  // Get alternative dates if no good matches
  const alternativeDates: string[] = [];
  if (scoredSlots.length < 3) {
    const allDates = [...new Set(availabilities.map(a => a.date))].sort();
    alternativeDates.push(...allDates.slice(0, 5));
  }

  return {
    suggestions: scoredSlots.slice(0, 5),  // Top 5 suggestions
    totalOptions: scoredSlots.length,
    bestMatch: scoredSlots[0] || null,
    alternativeDates,
    waitlistRecommended,
  };
}

// ─── Grouping & Display ────────────────────────────────────────────────────

/**
 * Group suggestions by date for better UI display
 */
export function groupSuggestionsByDate(suggestions: ScoredSlot[]): Map<string, ScoredSlot[]> {
  const grouped = new Map<string, ScoredSlot[]>();
  
  for (const slot of suggestions) {
    const existing = grouped.get(slot.date) || [];
    existing.push(slot);
    grouped.set(slot.date, existing);
  }
  
  return grouped;
}

/**
 * Format suggestions for display
 */
export function formatSuggestion(slot: ScoredSlot, locale: string = 'ar'): string {
  const date = new Date(slot.date).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return `${date} - ${slot.time} مع ${slot.doctorName}`;
}

// ─── Structured Logging ────────────────────────────────────────────────────

export function logAutoSchedule(
  patientId: string,
  result: AutoScheduleResult,
  duration: number
): void {
  console.error(`[AUTO_SCHEDULE] ${JSON.stringify({
    ts: new Date().toISOString(),
    patientId,
    suggestionsCount: result.suggestions.length,
    bestScore: result.bestMatch?.score,
    waitlistRecommended: result.waitlistRecommended,
    duration: `${duration}ms`,
  })}`);
}
