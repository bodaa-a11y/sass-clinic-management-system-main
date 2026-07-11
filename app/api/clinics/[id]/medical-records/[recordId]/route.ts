import { z } from 'zod';
import { db } from '@/db';
import { medicalRecords, clinics, patients, users, appointments } from '@/db/schema';
import { validateTenantScope, getUserContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const updateMedicalRecordSchema = z.object({
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  symptoms: z.string().optional(),
  clinicalNotes: z.string().optional(),
  vitalSigns: z.string().optional(),
  treatmentPlan: z.string().optional(),
  followUpDate: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: clinicId, recordId } = await params;

    // Validate tenant scope + permission (medical_records:update)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const body = await request.json();
    const validatedData = updateMedicalRecordSchema.parse(body);

    // Check if medical record exists and belongs to this clinic
    const existingRecord = await db
      .select()
      .from(medicalRecords)
      .where(
        and(
          eq(medicalRecords.id, recordId),
          eq(medicalRecords.clinicId, clinicId),
          isNull(medicalRecords.deletedAt)
        )
      )
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Medical record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update medical record
    const [updatedRecord] = await db
      .update(medicalRecords)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(medicalRecords.id, recordId),
          eq(medicalRecords.clinicId, clinicId),
          isNull(medicalRecords.deletedAt)
        )
      )
      .returning();

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'UPDATE_MEDICAL_RECORD',
        entityType: 'medical_record',
        entityId: recordId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update medical record', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: clinicId, recordId } = await params;

    // Validate tenant scope + permission (medical_records:delete)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    // Check if medical record exists and belongs to this clinic
    const existingRecord = await db
      .select()
      .from(medicalRecords)
      .where(
        and(
          eq(medicalRecords.id, recordId),
          eq(medicalRecords.clinicId, clinicId),
          isNull(medicalRecords.deletedAt)
        )
      )
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Medical record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete medical record
    await db
      .update(medicalRecords)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(
        and(
          eq(medicalRecords.id, recordId),
          eq(medicalRecords.clinicId, clinicId),
          isNull(medicalRecords.deletedAt)
        )
      );

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'UPDATE_MEDICAL_RECORD',
        entityType: 'medical_record',
        entityId: recordId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete medical record', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
