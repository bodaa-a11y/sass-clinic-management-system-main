import { z } from 'zod';
import { db } from '@/db';
import { payments, invoices, clinics, patients } from '@/db/schema';
import { paymentSchema } from '@/lib/validations';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate tenant scope + permission (payments:read)
    const tenantCheck = await validateTenantScope(request, id, 'payments', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const patientId = searchParams.get('patientId');
    const paymentMethod = searchParams.get('paymentMethod');

    // Build WHERE conditions
    const conditions = [
      eq(payments.clinicId, id),
      isNull(payments.deletedAt)
    ];

    if (invoiceId) {
      conditions.push(eq(payments.invoiceId, invoiceId));
    }
    if (patientId) {
      conditions.push(eq(payments.patientId, patientId));
    }
    if (paymentMethod) {
      conditions.push(eq(payments.paymentMethod, paymentMethod as 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'online'));
    }

    // Query with JOINs to get patient and invoice info
    const allPayments = await db
      .select({
        id: payments.id,
        clinicId: payments.clinicId,
        invoiceId: payments.invoiceId,
        patientId: payments.patientId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionId: payments.transactionId,
        paymentDate: payments.paymentDate,
        notes: payments.notes,
        createdAt: payments.createdAt,
        patientName: patients.fullName,
        invoiceNumber: invoices.invoiceNumber,
        invoiceStatus: invoices.status,
      })
      .from(payments)
      .leftJoin(patients, eq(payments.patientId, patients.id))
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(and(...conditions))
      .orderBy(payments.paymentDate);

    return NextResponse.json({
      data: allPayments,
      count: allPayments.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch payments',
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

    // Validate tenant scope + permission (payments:read)
    const tenantCheck = await validateTenantScope(request, id, 'payments', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Validate invoice exists and belongs to clinic
    const invoice = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.id, validatedData.invoiceId),
        eq(invoices.clinicId, id),
        isNull(invoices.deletedAt)
      ))
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json(
        {
          error: 'Invoice not found or does not belong to this clinic',
          code: 'INVOICE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Validate patient exists and belongs to clinic
    const patient = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, validatedData.patientId),
        eq(patients.clinicId, id),
        isNull(patients.deletedAt)
      ))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json(
        {
          error: 'Patient not found or does not belong to this clinic',
          code: 'PATIENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if payment amount exceeds remaining balance
    const currentPaidAmount = parseFloat(invoice[0].paidAmount || '0');
    const balanceAmount = parseFloat(invoice[0].balanceAmount || '0');
    const paymentAmount = parseFloat(validatedData.amount);

    if (paymentAmount > balanceAmount) {
      return NextResponse.json(
        {
          error: 'Payment amount exceeds remaining balance',
          code: 'PAYMENT_EXCEEDS_BALANCE',
        },
        { status: 400 }
      );
    }

    // Create payment
    const newPayment = await db
      .insert(payments)
      .values({
        clinicId: id,
        ...validatedData,
        amount: paymentAmount.toString(),
      })
      .returning();

    // Update invoice paid amount and balance
    const newPaidAmount = currentPaidAmount + paymentAmount;
    const newBalanceAmount = balanceAmount - paymentAmount;
    let newStatus = invoice[0].status || 'draft';

    // Update invoice status if fully paid
    if (newBalanceAmount <= 0) {
      newStatus = 'paid';
    } else if (invoice[0].status === 'draft') {
      newStatus = 'sent';
    }

    await db
      .update(invoices)
      .set({
        paidAmount: newPaidAmount.toString(),
        balanceAmount: newBalanceAmount.toString(),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, validatedData.invoiceId));

    // Audit logging
    await logAudit({
      action: 'CREATE_PAYMENT',
      entityType: 'payment',
      entityId: newPayment[0].id,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: {
        ...newPayment[0],
        updatedInvoice: {
          paidAmount: newPaidAmount.toString(),
          balanceAmount: newBalanceAmount.toString(),
          status: newStatus,
        }
      },
    });

    return NextResponse.json(
      {
        data: {
          ...newPayment[0],
          updatedInvoice: {
            paidAmount: newPaidAmount.toString(),
            balanceAmount: newBalanceAmount.toString(),
            status: newStatus,
          }
        },
        message: 'Payment recorded successfully',
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
        error: error instanceof Error ? error.message : 'Failed to process payment',
        code: 'PAYMENT_ERROR',
      },
      { status: 500 }
    );
  }
}
