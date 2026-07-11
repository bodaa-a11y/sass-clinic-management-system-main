import { z } from 'zod';
import { db } from '@/db';
import { availabilitySlots, clinics, users } from '@/db/schema';
import { availabilitySlotSchema } from '@/lib/validations';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

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
    const doctorIdFilter = searchParams.get('doctor_id');

    let query = db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.clinicId, id));

    if (doctorIdFilter) {
      query = db
        .select()
        .from(availabilitySlots)
        .where(
          and(
            eq(availabilitySlots.clinicId, id),
            eq(availabilitySlots.doctorId, doctorIdFilter)
          )
        );
    }

    const allSlots = await query;

    return NextResponse.json({
      data: allSlots,
      count: allSlots.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch availability slots',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json();
    const validatedData = availabilitySlotSchema.parse(body);

    const doctor = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, validatedData.doctorId),
          eq(users.clinicId, id),
          eq(users.role, 'doctor')
        )
      )
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        {
          error: 'Doctor not found or does not belong to this clinic',
          code: 'DOCTOR_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const newSlot = await db
      .insert(availabilitySlots)
      .values({
        clinicId: id,
        doctorId: validatedData.doctorId,
        dayOfWeek: validatedData.dayOfWeek,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        slotDurationMinutes: validatedData.slotDurationMinutes,
        bufferAfterMinutes: validatedData.bufferAfterMinutes ?? 0,
      })
      .returning();

    return NextResponse.json(
      {
        data: newSlot[0],
        message: 'Availability slot created successfully',
      },
      { status: 201 }
    );
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
        error: error instanceof Error ? error.message : 'Failed to create availability slot',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (!doctorId) {
      return NextResponse.json(
        {
          error: 'doctor_id query parameter is required',
          code: 'MISSING_PARAMS',
        },
        { status: 400 }
      );
    }

    // Delete all availability slots for this doctor in this clinic
    await db
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.clinicId, id),
          eq(availabilitySlots.doctorId, doctorId)
        )
      );

    return NextResponse.json({
      message: 'All availability slots deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete availability slots',
        code: 'DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
