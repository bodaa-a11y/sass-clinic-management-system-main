import { db } from '@/db';
import { waitlist, clinics, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const waitlistSchema = z.object({
  doctor_id: z.string().uuid(),
  patient_name: z.string().min(2),
  patient_phone: z.string().min(5),
  patient_email: z.string().email().optional(),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// POST: Add patient to waitlist
export async function POST(
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
    const body = await request.json();

    // Validate request body
    const validatedData = waitlistSchema.parse(body);

    // Verify doctor exists and is active
    const doctor = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, validatedData.doctor_id),
          eq(users.clinicId, clinicId),
          eq(users.role, 'doctor'),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        { error: 'Doctor not found or inactive', code: 'DOCTOR_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if patient already in waitlist for same doctor and date
    const existingEntry = await db
      .select()
      .from(waitlist)
      .where(
        and(
          eq(waitlist.clinicId, clinicId),
          eq(waitlist.doctorId, validatedData.doctor_id),
          eq(waitlist.patientPhone, validatedData.patient_phone),
          eq(waitlist.preferredDate, validatedData.preferred_date),
          eq(waitlist.status, 'waiting')
        )
      )
      .limit(1);

    if (existingEntry.length > 0) {
      return NextResponse.json(
        { error: 'You are already on the waitlist for this date', code: 'ALREADY_WAITING' },
        { status: 409 }
      );
    }

    // Add to waitlist
    const newEntry = await db
      .insert(waitlist)
      .values({
        clinicId,
        doctorId: validatedData.doctor_id,
        patientName: validatedData.patient_name,
        patientPhone: validatedData.patient_phone,
        patientEmail: validatedData.patient_email,
        preferredDate: validatedData.preferred_date,
        status: 'waiting',
      })
      .returning();

    return NextResponse.json(
      {
        data: {
          id: newEntry[0].id,
          patient_name: validatedData.patient_name,
          preferred_date: validatedData.preferred_date,
          status: 'waiting',
        },
        message: 'تم تسجيلك في قائمة الانتظار بنجاح',
      },
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
      { error: error instanceof Error ? error.message : 'Failed to add to waitlist', code: 'WAITLIST_ERROR' },
      { status: 500 }
    );
  }
}
