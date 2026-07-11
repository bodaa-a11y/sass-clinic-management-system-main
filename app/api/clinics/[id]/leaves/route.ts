import { db } from '@/db';
import { doctorLeaves, clinics, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createLeaveSchema = z.object({
  doctorId: z.string().uuid(),
  leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

// GET: Fetch all leaves for a clinic with optional doctor filter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');

    // Check clinic exists
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build query
    let query = db
      .select({
        leave: doctorLeaves,
        doctorName: users.name,
      })
      .from(doctorLeaves)
      .leftJoin(users, eq(doctorLeaves.doctorId, users.id))
      .where(eq(doctorLeaves.clinicId, id));

    if (doctorId) {
      query = db
        .select({
          leave: doctorLeaves,
          doctorName: users.name,
        })
        .from(doctorLeaves)
        .leftJoin(users, eq(doctorLeaves.doctorId, users.id))
        .where(and(eq(doctorLeaves.clinicId, id), eq(doctorLeaves.doctorId, doctorId)));
    }

    const leaves = await query;

    return NextResponse.json({
      data: leaves.map((item) => ({
        ...item.leave,
        doctorName: item.doctorName,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leaves', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

// POST: Add a new leave
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = createLeaveSchema.parse(body);

    // Check clinic exists
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check doctor exists and belongs to clinic
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
        { error: 'Doctor not found', code: 'DOCTOR_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check leave date is in the future
    const leaveDate = new Date(validatedData.leaveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (leaveDate < today) {
      return NextResponse.json(
        { error: 'Leave date must be in the future', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    // Check for duplicate leave
    const existingLeave = await db
      .select()
      .from(doctorLeaves)
      .where(
        and(
          eq(doctorLeaves.clinicId, id),
          eq(doctorLeaves.doctorId, validatedData.doctorId),
          eq(doctorLeaves.leaveDate, validatedData.leaveDate)
        )
      )
      .limit(1);

    if (existingLeave.length > 0) {
      return NextResponse.json(
        { error: 'Leave already exists for this date', code: 'DUPLICATE_LEAVE' },
        { status: 409 }
      );
    }

    // Create leave
    const newLeave = await db
      .insert(doctorLeaves)
      .values({
        clinicId: id,
        doctorId: validatedData.doctorId,
        leaveDate: validatedData.leaveDate,
        reason: validatedData.reason,
      })
      .returning();

    return NextResponse.json(
      { data: newLeave[0], message: 'Leave added successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add leave', code: 'CREATE_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a leave
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get('leave_id');

    if (!leaveId) {
      return NextResponse.json(
        { error: 'leave_id query parameter is required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // Check clinic exists
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check leave exists and belongs to clinic
    const leave = await db
      .select()
      .from(doctorLeaves)
      .where(
        and(
          eq(doctorLeaves.id, leaveId),
          eq(doctorLeaves.clinicId, id)
        )
      )
      .limit(1);

    if (leave.length === 0) {
      return NextResponse.json(
        { error: 'Leave not found', code: 'LEAVE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete leave
    await db
      .delete(doctorLeaves)
      .where(eq(doctorLeaves.id, leaveId));

    return NextResponse.json(
      { message: 'Leave deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete leave', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
