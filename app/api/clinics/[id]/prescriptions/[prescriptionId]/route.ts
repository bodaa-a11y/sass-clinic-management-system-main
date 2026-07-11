import { z } from 'zod';
import { db } from '@/db';
import { prescriptions, clinics, patients, users } from '@/db/schema';
import { validateTenantScope, getUserContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const updatePrescriptionSchema = z.object({
  medicationName: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  status: z.enum(['active', 'completed', 'discontinued']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prescriptionId: string }> }
) {
  try {
    const { id: clinicId, prescriptionId } = await params;

    // Validate tenant scope + permission (prescriptions:update)
    const tenantCheck = await validateTenantScope(request, clinicId, 'prescriptions', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const body = await request.json();
    const validatedData = updatePrescriptionSchema.parse(body);

    // Check if prescription exists and belongs to this clinic
    const existingPrescription = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.clinicId, clinicId),
          isNull(prescriptions.deletedAt)
        )
      )
      .limit(1);

    if (existingPrescription.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update prescription
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.clinicId, clinicId),
          isNull(prescriptions.deletedAt)
        )
      )
      .returning();

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'UPDATE_PRESCRIPTION',
        entityType: 'prescription',
        entityId: prescriptionId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ data: updatedPrescription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update prescription', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prescriptionId: string }> }
) {
  try {
    const { id: clinicId, prescriptionId } = await params;

    // Validate tenant scope + permission (prescriptions:delete)
    const tenantCheck = await validateTenantScope(request, clinicId, 'prescriptions', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    // Check if prescription exists and belongs to this clinic
    const existingPrescription = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.clinicId, clinicId),
          isNull(prescriptions.deletedAt)
        )
      )
      .limit(1);

    if (existingPrescription.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete prescription
    await db
      .update(prescriptions)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(
        and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.clinicId, clinicId),
          isNull(prescriptions.deletedAt)
        )
      );

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'DELETE_PRESCRIPTION',
        entityType: 'prescription',
        entityId: prescriptionId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete prescription', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
