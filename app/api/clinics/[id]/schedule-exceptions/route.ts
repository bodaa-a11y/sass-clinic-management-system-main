import { z } from 'zod';
import { db } from '@/db';
import { scheduleExceptions, clinics, users } from '@/db/schema';
import { scheduleExceptionSchema } from '@/lib/validations';
import { eq, and, isNull } from 'drizzle-orm';
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
    const doctorId = searchParams.get('doctorId');
    const exceptionType = searchParams.get('exceptionType');
    const isActive = searchParams.get('isActive');

    // Build WHERE conditions
    const conditions = [
      eq(scheduleExceptions.clinicId, id),
      isNull(scheduleExceptions.deletedAt)
    ];

    if (doctorId) {
      conditions.push(eq(scheduleExceptions.doctorId, doctorId));
    }
    if (exceptionType) {
      conditions.push(eq(scheduleExceptions.exceptionType, exceptionType as 'vacation' | 'sick_leave' | 'personal' | 'conference' | 'other'));
    }
    if (isActive !== null) {
      conditions.push(eq(scheduleExceptions.isActive, isActive === 'true'));
    }

    // Query with JOINs to get doctor name
    const allExceptions = await db
      .select({
        id: scheduleExceptions.id,
        clinicId: scheduleExceptions.clinicId,
        doctorId: scheduleExceptions.doctorId,
        startDate: scheduleExceptions.startDate,
        endDate: scheduleExceptions.endDate,
        exceptionType: scheduleExceptions.exceptionType,
        reason: scheduleExceptions.reason,
        isRecurring: scheduleExceptions.isRecurring,
        isActive: scheduleExceptions.isActive,
        createdAt: scheduleExceptions.createdAt,
        updatedAt: scheduleExceptions.updatedAt,
        doctorName: users.name,
      })
      .from(scheduleExceptions)
      .leftJoin(users, eq(scheduleExceptions.doctorId, users.id))
      .where(and(...conditions))
      .orderBy(scheduleExceptions.startDate);

    return NextResponse.json({
      data: allExceptions,
      count: allExceptions.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch schedule exceptions',
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
    const validatedData = scheduleExceptionSchema.parse(body);

    // Validate doctor exists and belongs to clinic
    const doctor = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, validatedData.doctorId),
        eq(users.clinicId, id),
        eq(users.role, 'doctor'),
        eq(users.isActive, true),
        isNull(users.deletedAt)
      ))
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        {
          error: 'Doctor not found, inactive, or does not belong to this clinic',
          code: 'DOCTOR_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate > endDate) {
      return NextResponse.json(
        {
          error: 'Start date cannot be after end date',
          code: 'INVALID_DATE_RANGE',
        },
        { status: 400 }
      );
    }

    // Check for overlapping exceptions (only if not recurring)
    if (!validatedData.isRecurring) {
      const overlappingException = await db
        .select()
        .from(scheduleExceptions)
        .where(and(
          eq(scheduleExceptions.doctorId, validatedData.doctorId),
          eq(scheduleExceptions.isActive, true),
          isNull(scheduleExceptions.deletedAt),
          // Check if date ranges overlap
          // This is a simple check - you might want to implement more sophisticated overlap logic
        ))
        .limit(1);

      // For now, we'll allow overlapping exceptions but you could add validation here
    }

    const newException = await db
      .insert(scheduleExceptions)
      .values({
        clinicId: id,
        ...validatedData,
      })
      .returning();

    return NextResponse.json(
      {
        data: newException[0],
        message: 'Schedule exception created successfully',
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
        error: error instanceof Error ? error.message : 'Failed to create schedule exception',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}
