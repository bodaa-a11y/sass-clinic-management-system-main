import { db } from '@/db';
import { appointments, availabilitySlots, clinics } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  bookedSlots: string[]
): Array<{ time: string; isAvailable: boolean }> {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const slots: Array<{ time: string; isAvailable: boolean }> = [];

  for (let current = start; current < end; current += durationMinutes) {
    const timeStr = formatTime(current);
    slots.push({
      time: timeStr,
      isAvailable: !bookedSlots.includes(timeStr),
    });
  }

  return slots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        {
          error: 'Clinic not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        {
          error: 'doctor_id and date query parameters are required',
          code: 'MISSING_PARAMS',
        },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        {
          error: 'Date must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT',
        },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const availabilityConfig = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.clinicId, id),
          eq(availabilitySlots.doctorId, doctorId),
          eq(availabilitySlots.dayOfWeek, dayOfWeek)
        )
      )
      .limit(1);

    if (availabilityConfig.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No availability configured for this doctor on this day',
      });
    }

    const config = availabilityConfig[0];

    const bookedAppointments = await db
      .select({ startTime: appointments.startTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, id),
          eq(appointments.doctorId, doctorId),
          eq(appointments.appointmentDate, date),
          eq(appointments.status, 'confirmed')
        )
      );

    const bookedSlots = bookedAppointments.map((apt) => apt.startTime);

    const availableSlots = generateTimeSlots(
      config.startTime,
      config.endTime,
      config.slotDurationMinutes,
      bookedSlots
    );

    return NextResponse.json({
      data: {
        date,
        dayOfWeek,
        doctorId,
        slots: availableSlots,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to calculate available slots',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
