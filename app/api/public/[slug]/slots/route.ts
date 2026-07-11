import { db } from '@/db';
import { appointments, availabilitySlots, clinics, doctorLeaves } from '@/db/schema';
import {
  buildOccupiedRanges,
  generateSlots,
  type AvailabilityConfig,
  type BookedAppointment,
} from '@/lib/booking-engine';
import { and, eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get clinic by slug
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, slug))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const clinicId = clinic[0].id;
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');

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

    // Fetch availability config + leave check + booked appointments in parallel
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

    if (availabilityConfig.length === 0) {
      return NextResponse.json({
        data: { date, dayOfWeek, doctorId, slots: [] },
        message: 'No availability configured for this doctor on this day',
      });
    }

    if (leaveCheck.length > 0) {
      return NextResponse.json({
        data: { date, dayOfWeek, doctorId, slots: [] },
        message: 'الدكتور في إجازة هذا اليوم',
        isOnLeave: true,
      });
    }

    const config = availabilityConfig[0];

    const engineConfig: AvailabilityConfig = {
      startTime: config.startTime,
      endTime: config.endTime,
      slotDurationMinutes: config.slotDurationMinutes,
      bufferAfterMinutes: config.bufferAfterMinutes,
    };

    const booked: BookedAppointment[] = bookedAppointments.map((a) => ({
      startTime: a.startTime,
    }));

    // O(n log n): build sorted ranges once, then O(log n) per slot check
    const occupied = buildOccupiedRanges(
      booked,
      config.slotDurationMinutes,
      config.bufferAfterMinutes
    );

    const slots = generateSlots(engineConfig, occupied);

    return NextResponse.json({
      data: {
        date,
        dayOfWeek,
        doctorId,
        slots,
        bufferAfterMinutes: config.bufferAfterMinutes,
        slotDurationMinutes: config.slotDurationMinutes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to calculate slots',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
