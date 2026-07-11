import { z } from 'zod';
import { db } from '@/db';
import { invoices, clinics, patients, appointments } from '@/db/schema';
import { validateTenantScope, getUserContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  paymentMethod: z.enum(['cash', 'card', 'insurance', 'bank_transfer', 'online']).optional(),
  notes: z.string().optional(),
  subtotal: z.string().optional(),
  taxAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  totalAmount: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const { id: clinicId, invoiceId } = await params;

    // Validate tenant scope + permission (invoices:update)
    const tenantCheck = await validateTenantScope(request, clinicId, 'invoices', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const body = await request.json();
    const validatedData = updateInvoiceSchema.parse(body);

    // Check if invoice exists and belongs to this clinic
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.clinicId, clinicId),
          isNull(invoices.deletedAt)
        )
      )
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.clinicId, clinicId),
          isNull(invoices.deletedAt)
        )
      )
      .returning();

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'UPDATE_INVOICE',
        entityType: 'invoice',
        entityId: invoiceId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ data: updatedInvoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update invoice', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const { id: clinicId, invoiceId } = await params;

    // Validate tenant scope + permission (invoices:delete)
    const tenantCheck = await validateTenantScope(request, clinicId, 'invoices', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    // Check if invoice exists and belongs to this clinic
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.clinicId, clinicId),
          isNull(invoices.deletedAt)
        )
      )
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete invoice
    await db
      .update(invoices)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.clinicId, clinicId),
          isNull(invoices.deletedAt)
        )
      );

    // Log audit
    const userContext = await getUserContext(request);
    if (userContext) {
      await logAudit({
        clinicId,
        userId: userContext.userId,
        action: 'UPDATE_INVOICE',
        entityType: 'invoice',
        entityId: invoiceId,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete invoice', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
