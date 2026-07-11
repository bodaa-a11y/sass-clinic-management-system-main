import { db } from '@/db';
import { waitlist, clinics, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// GET: Fetch all waitlist entries for a clinic
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const entries = await db
      .select({
        entry: waitlist,
        doctorName: users.name,
      })
      .from(waitlist)
      .leftJoin(users, eq(waitlist.doctorId, users.id))
      .where(eq(waitlist.clinicId, id))
      .orderBy(waitlist.createdAt);

    return NextResponse.json({
      data: entries.map((item) => ({
        ...item.entry,
        doctorName: item.doctorName,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch waitlist', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

const updateStatusSchema = z.object({
  status: z.enum(['waiting', 'notified', 'booked']),
});

// PATCH: Update waitlist entry status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entry_id');

    if (!entryId) {
      return NextResponse.json(
        { error: 'entry_id query parameter is required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

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

    // Check entry exists and belongs to clinic
    const entry = await db
      .select()
      .from(waitlist)
      .where(
        and(
          eq(waitlist.id, entryId),
          eq(waitlist.clinicId, id)
        )
      )
      .limit(1);

    if (entry.length === 0) {
      return NextResponse.json(
        { error: 'Entry not found', code: 'ENTRY_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update status
    const updatedEntry = await db
      .update(waitlist)
      .set({ status: validatedData.status })
      .where(eq(waitlist.id, entryId))
      .returning();

    return NextResponse.json({
      data: updatedEntry[0],
      message: 'Status updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update status', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}
