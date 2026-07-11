import { db } from '@/db';
import { appointments, availabilitySlots, clinics, doctorLeaves } from '@/db/schema';
import {
  buildOccupiedRanges,
  generateSlots,
  suggestAlternativeSlots,
  type AppointmentPriority,
  type AvailabilityConfig,
  type BookedAppointment,
  type BookingProposal,
} from '@/lib/booking-engine';
import { and, eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/public/[slug]/smart-availability
 *
 * Returns enriched slot info + auto-suggestions for a given doctor/date.
 * Does NOT book anything. Used by the UI to show smarter slot pickers.
 *
 * Query params:
 *   doctor_id   required
 *   date        required  (YYYY-MM-DD)
 *   priority    optional  default: "normal" — use "emergency" to bypass same-day rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, slug))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json({ error: 'Clinic not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const clinicId = clinic[0].id;
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');
    const priority = (searchParams.get('priority') ?? 'normal') as AppointmentPriority;

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'doctor_id and date are required', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Date must be YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Parallel fetches
    const [availabilityConfig, leaveCheck, bookedAppointments] = await Promise.all([
      db
        .select()
        .from(availabilitySlots)
        .where(
          and(
            eq(availabilitySlots.clinicId, clinicId),
            eq(availabilitySlots.doctorId, doctorId),
            eq(availabilitySlots.dayOfWeek, dayOfWeek)
          )
        )
        .limit(1),

      db
        .select()
        .from(doctorLeaves)
        .where(
          and(
            eq(doctorLeaves.clinicId, clinicId),
            eq(doctorLeaves.doctorId, doctorId),
            eq(doctorLeaves.leaveDate, date)
          )
        )
        .limit(1),

      db
        .select({ startTime: appointments.startTime })
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, clinicId),
            eq(appointments.doctorId, doctorId),
            eq(appointments.appointmentDate, date),
            or(
              eq(appointments.status, 'confirmed'),
              eq(appointments.status, 'pending'),
              eq(appointments.status, 'in-waiting-room'),
              eq(appointments.status, 'in-progress')
            )
          )
        ),
    ]);

    if (leaveCheck.length > 0) {
      return NextResponse.json({
        data: { date, doctorId, priority, slots: [], isOnLeave: true, firstAvailable: null },
      });
    }

    if (availabilityConfig.length === 0) {
      return NextResponse.json({
        data: { date, doctorId, priority, slots: [], noConfig: true, firstAvailable: null },
      });
    }

    const config = availabilityConfig[0];
    const engineConfig: AvailabilityConfig = {
      startTime: config.startTime,
      endTime: config.endTime,
      slotDurationMinutes: config.slotDurationMinutes,
      bufferAfterMinutes: config.bufferAfterMinutes,
    };

    const booked: BookedAppointment[] = bookedAppointments.map((a) => ({ startTime: a.startTime }));

    // O(n log n) range build, then O(log n) per slot
    const occupied = buildOccupiedRanges(booked, config.slotDurationMinutes, config.bufferAfterMinutes);
    const slots = generateSlots(engineConfig, occupied);

    // For emergency: immediately surface the first available slot
    const firstAvailable = slots.find((s) => s.isAvailable)?.time ?? null;

    // Auto-suggestions if everything is booked (use "emergency" proposal to scan from start)
    let suggestions: string[] = [];
    if (slots.every((s) => !s.isAvailable)) {
      const proposal: BookingProposal = {
        requestedTime: config.startTime,
        priority,
        doctorId,
        date,
      };
      suggestions = suggestAlternativeSlots(proposal, engineConfig, occupied, 4);
    }

    return NextResponse.json({
      data: {
        date,
        dayOfWeek,
        doctorId,
        priority,
        isOnLeave: false,
        slots,
        firstAvailable: priority === 'emergency' ? firstAvailable : null,
        fullyBooked: slots.every((s) => !s.isAvailable),
        suggestions,
        meta: {
          slotDurationMinutes: config.slotDurationMinutes,
          bufferAfterMinutes: config.bufferAfterMinutes,
          totalSlots: slots.length,
          availableSlots: slots.filter((s) => s.isAvailable).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load smart availability', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
