import { z } from 'zod';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const patientId = request.headers.get('x-patient-id');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID required', code: 'MISSING_PATIENT_ID' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = bookAppointmentSchema.parse(body);

    // Check if slot is already booked
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, validatedData.doctorId),
          eq(appointments.appointmentDate, validatedData.appointmentDate),
          // Simple time overlap check
          // TODO: Implement proper time overlap detection
          isNull(appointments.deletedAt)
        )
      )
      .limit(1);

    if (existingAppointment.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is not available', code: 'SLOT_UNAVAILABLE' },
        { status: 400 }
      );
    }

    // Create appointment
    const result = await db
      .insert(appointments)
      .values({
        patientId,
        doctorId: validatedData.doctorId,
        clinicId: patientId, // TODO: Get actual clinicId from patient
        appointmentDate: validatedData.appointmentDate,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        notes: validatedData.notes,
        status: 'pending',
        priority: 'normal',
      })
      .returning();

    const newAppointment = Array.isArray(result) ? result[0] : result;

    return NextResponse.json(
      {
        message: 'Appointment booked successfully',
        appointment: newAppointment,
      },
      { status: 201 }
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

    console.error('Book appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
