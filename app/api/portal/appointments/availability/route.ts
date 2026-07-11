import { z } from 'zod';
import { db } from '@/db';
import { availabilitySlots, appointments, users, specialties } from '@/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const checkAvailabilitySchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'doctorId and date are required', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    const validatedData = checkAvailabilitySchema.parse({ doctorId, date });

    // Get day of week (0 = Sunday, 6 = Saturday)
    const targetDate = new Date(validatedData.date);
    const dayOfWeek = targetDate.getDay();

    // Fetch availability slots for this doctor on this day
    const slots = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.doctorId, validatedData.doctorId),
          eq(availabilitySlots.dayOfWeek, dayOfWeek),
          eq(availabilitySlots.isActive, true),
          isNull(availabilitySlots.deletedAt)
        )
      );

    // Fetch existing appointments for this doctor on this date
    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, validatedData.doctorId),
          eq(appointments.appointmentDate, validatedData.date),
          isNull(appointments.deletedAt)
        )
      );

    // Calculate available time slots
    const availableSlots = [];
    for (const slot of slots) {
      const { startTime, endTime, slotDurationMinutes } = slot;
      
      // Generate time slots
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      const duration = slotDurationMinutes;

      for (let time = start; time + duration <= end; time += duration) {
        const slotStart = minutesToTime(time);
        const slotEnd = minutesToTime(time + duration);

        // Check if this slot is already booked
        const isBooked = existingAppointments.some(apt => {
          const aptStart = timeToMinutes(apt.startTime);
          const aptEnd = apt.endTime ? timeToMinutes(apt.endTime) : aptStart + 30;
          
          // Check for overlap
          return (time < aptEnd && time + duration > aptStart);
        });

        if (!isBooked) {
          availableSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
          });
        }
      }
    }

    return NextResponse.json(
      {
        availableSlots,
        doctorId: validatedData.doctorId,
        date: validatedData.date,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
