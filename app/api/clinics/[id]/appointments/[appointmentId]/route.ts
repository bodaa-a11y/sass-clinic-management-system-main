import { z } from 'zod';
import { db } from '@/db';
import { appointments, clinics } from '@/db/schema';
import { appointmentUpdateSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if a status change is allowed based on appointment date
 * Clinical statuses (in-waiting-room, in-progress, done) can only be changed on the appointment day
 */
function canChangeStatus(status: string, appointmentDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];

  // These statuses require the appointment to be today
  const clinicalStatuses = ['in-waiting-room', 'in-progress', 'done'];
  if (clinicalStatuses.includes(status)) {
    return appointmentDate === today;
  }

  // Other statuses (pending, confirmed, cancelled, no-show) can be changed any time
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
  try {
    const { id, appointmentId } = await params;

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

    const appointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (appointment.length === 0 || appointment[0].clinicId !== id) {
      return NextResponse.json(
        {
          error: 'Appointment not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: appointment[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch appointment',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
  try {
    const { id, appointmentId } = await params;

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

    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (existingAppointment.length === 0 || existingAppointment[0].clinicId !== id) {
      return NextResponse.json(
        {
          error: 'Appointment not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = appointmentUpdateSchema.parse(body);

    // Validate status change based on appointment date
    if (!canChangeStatus(validatedData.status, existingAppointment[0].appointmentDate)) {
      return NextResponse.json(
        {
          error: 'لا يمكن تغيير حالة الموعد لهذا اليوم. يجب أن يكون الموعد اليوم.',
          code: 'INVALID_STATUS_CHANGE_DATE',
        },
        { status: 409 }
      );
    }

    const updateData: any = {
      status: validatedData.status,
    };

    // Auto-timestamp clinical transitions
    if (validatedData.status === 'in-waiting-room') {
      updateData.checkInTime = new Date();
    } else if (validatedData.status === 'in-progress') {
      updateData.startTimeActual = new Date();
    } else if (validatedData.status === 'done') {
      updateData.endTimeActual = new Date();
    }

    const updatedAppointment = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    return NextResponse.json({
      data: updatedAppointment[0],
      message: 'Appointment status updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update appointment',
        code: 'UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
  try {
    const { id, appointmentId } = await params;

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

    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (existingAppointment.length === 0 || existingAppointment[0].clinicId !== id) {
      return NextResponse.json(
        {
          error: 'Appointment not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = appointmentUpdateSchema.parse(body);

    // Validate status change based on appointment date
    if (!canChangeStatus(validatedData.status, existingAppointment[0].appointmentDate)) {
      return NextResponse.json(
        {
          error: 'لا يمكن تغيير حالة الموعد لهذا اليوم. يجب أن يكون الموعد اليوم.',
          code: 'INVALID_STATUS_CHANGE_DATE',
        },
        { status: 409 }
      );
    }

    const updateData: any = {
      status: validatedData.status,
    };

    // Auto-timestamp clinical transitions
    if (validatedData.status === 'in-waiting-room') {
      updateData.checkInTime = new Date();
    } else if (validatedData.status === 'in-progress') {
      updateData.startTimeActual = new Date();
    } else if (validatedData.status === 'done') {
      updateData.endTimeActual = new Date();
    }

    const updatedAppointment = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    return NextResponse.json({
      data: updatedAppointment[0],
      message: 'Appointment status updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update appointment',
        code: 'UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}
