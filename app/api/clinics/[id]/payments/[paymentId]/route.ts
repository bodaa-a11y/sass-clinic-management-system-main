import { z } from 'zod';
import { db } from '@/db';
import { payments, invoices, clinics, patients } from '@/db/schema';
import { validateTenantScope, getUserContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const updatePaymentSchema = z.object({
  amount: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'insurance', 'bank_transfer', 'online']).optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { id: clinicId, paymentId } = await params;

    // Validate tenant scope + permission (payments:update)
    const tenantCheck = await validateTenantScope(request, clinicId, 'payments', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const body = await request.json();
    const validatedData = updatePaymentSchema.parse(body);

    // Check if payment exists and belongs to this clinic
    const existingPayment = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.clinicId, clinicId),
          isNull(payments.deletedAt)
        )
      )
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update payment
    const [updatedPayment] = await db
      .update(payments)
      .set({
        ...validatedData,
      })
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.clinicId, clinicId),
          isNull(payments.deletedAt)
        )
      )
      .returning();

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'CREATE_PAYMENT',
        entityType: 'payment',
        entityId: paymentId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ data: updatedPayment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payment', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { id: clinicId, paymentId } = await params;

    // Validate tenant scope + permission (payments:delete)
    const tenantCheck = await validateTenantScope(request, clinicId, 'payments', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    // Check if payment exists and belongs to this clinic
    const existingPayment = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.clinicId, clinicId),
          isNull(payments.deletedAt)
        )
      )
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete payment
    await db
      .update(payments)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.clinicId, clinicId),
          isNull(payments.deletedAt)
        )
      );

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'CREATE_PAYMENT',
        entityType: 'payment',
        entityId: paymentId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete payment', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
