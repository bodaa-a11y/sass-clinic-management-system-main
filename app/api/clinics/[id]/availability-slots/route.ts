import { db } from '@/db';
import { availabilitySlots, appointments } from '@/db/schema';
import { and, eq, gte, lte, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params;
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'doctorId and date are required', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Fetch availability slots for this doctor and day
    const availability = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.clinicId, clinicId),
          eq(availabilitySlots.doctorId, doctorId),
          eq(availabilitySlots.dayOfWeek, dayOfWeek),
          eq(availabilitySlots.isActive, true)
        )
      )
      .limit(1);

    if (availability.length === 0) {
      return NextResponse.json(
        { data: { availableSlots: [], occupiedSlots: [] } },
        { status: 200 }
      );
    }

    const config = availability[0];

    // Fetch existing appointments for this doctor on this date
    const bookedAppointments = await db
      .select({ startTime: appointments.startTime, status: appointments.status })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.doctorId, doctorId),
          eq(appointments.appointmentDate, date),
          or(
            eq(appointments.status, 'confirmed'),
            eq(appointments.status, 'pending')
          )
        )
      );

    // Generate time slots based on availability configuration
    interface SlotInfo {
      time: string
      isAvailable: boolean
      reason?: 'booked' | 'pending'
    }

    const slots: SlotInfo[] = [];

    const [startHour, startMinute] = config.startTime.split(':').map(Number);
    const [endHour, endMinute] = config.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const slotDuration = config.slotDurationMinutes;
    const bufferAfter = config.bufferAfterMinutes;

    let currentMinutes = startMinutes;
    while (currentMinutes + slotDuration <= endMinutes) {
      const timeString = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;

      // Check if this slot is booked
      const bookedAppointment = bookedAppointments.find(
        (apt) => apt.startTime === timeString
      );

      if (bookedAppointment) {
        slots.push({
          time: timeString,
          isAvailable: false,
          reason: bookedAppointment.status === 'pending' ? 'pending' : 'booked',
        });
      } else {
        slots.push({
          time: timeString,
          isAvailable: true,
        });
      }

      // Move to next slot (accounting for buffer but not showing buffer slots)
      currentMinutes += slotDuration + bufferAfter;
    }

    return NextResponse.json(
      {
        data: {
          slots,
          config: {
            startTime: config.startTime,
            endTime: config.endTime,
            slotDurationMinutes: config.slotDurationMinutes,
            bufferAfterMinutes: config.bufferAfterMinutes,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[availability-slots] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch availability',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
