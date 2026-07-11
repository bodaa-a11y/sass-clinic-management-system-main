import { z } from 'zod';
import { db } from '@/db';
import { prescriptionRefillRequests } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const refillRequestSchema = z.object({
  prescriptionId: z.string().uuid('Invalid prescription ID'),
  pharmacyName: z.string().optional(),
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
    const validatedData = refillRequestSchema.parse(body);

    // Check if there's already a pending refill request for this prescription
    const existingRequest = await db
      .select()
      .from(prescriptionRefillRequests)
      .where(
        and(
          eq(prescriptionRefillRequests.prescriptionId, validatedData.prescriptionId),
          eq(prescriptionRefillRequests.patientId, patientId),
          eq(prescriptionRefillRequests.status, 'pending'),
          isNull(prescriptionRefillRequests.deletedAt)
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return NextResponse.json(
        { error: 'A pending refill request already exists for this prescription', code: 'PENDING_REQUEST_EXISTS' },
        { status: 400 }
      );
    }

    // Create refill request
    const result = await db
      .insert(prescriptionRefillRequests)
      .values({
        patientId,
        prescriptionId: validatedData.prescriptionId,
        pharmacyName: validatedData.pharmacyName || null,
        notes: validatedData.notes || null,
        status: 'pending',
      })
      .returning();

    const newRequest = Array.isArray(result) ? result[0] : result;

    return NextResponse.json(
      {
        message: 'Refill request submitted successfully',
        request: newRequest,
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

    console.error('Refill request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
