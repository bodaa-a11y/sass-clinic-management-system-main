import { z } from 'zod';
import { db } from '@/db';
import { invoices, clinics, patients, appointments } from '@/db/schema';
import { invoiceSchema } from '@/lib/validations';
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

    // Validate tenant scope + permission (invoices:read)
    const tenantCheck = await validateTenantScope(request, id, 'invoices', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const appointmentId = searchParams.get('appointmentId');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');

    // Build WHERE conditions
    const conditions = [
      eq(invoices.clinicId, id),
      isNull(invoices.deletedAt)
    ];

    // Role-based filtering: Receptionists see only clinic invoices (already filtered by clinicId)
    // Future: Add createdBy field to filter by staff member or shift

    if (patientId) {
      conditions.push(eq(invoices.patientId, patientId));
    }
    if (appointmentId) {
      conditions.push(eq(invoices.appointmentId, appointmentId));
    }
    if (status) {
      conditions.push(eq(invoices.status, status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'));
    }
    if (paymentMethod) {
      conditions.push(eq(invoices.paymentMethod, paymentMethod as 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'online'));
    }

    // Query with JOINs to get patient and appointment info
    const allInvoices = await db
      .select({
        id: invoices.id,
        clinicId: invoices.clinicId,
        patientId: invoices.patientId,
        appointmentId: invoices.appointmentId,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        balanceAmount: invoices.balanceAmount,
        status: invoices.status,
        paymentMethod: invoices.paymentMethod,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        patientName: patients.fullName,
        appointmentDate: appointments.appointmentDate,
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(appointments, eq(invoices.appointmentId, appointments.id))
      .where(and(...conditions))
      .orderBy(invoices.createdAt);

    return NextResponse.json({
      data: allInvoices,
      count: allInvoices.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch invoices',
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

    // Validate tenant scope + permission (invoices:create)
    const tenantCheck = await validateTenantScope(request, id, 'invoices', 'POST');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

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

    // If appointmentId is provided, validate it exists and belongs to clinic
    if (validatedData.appointmentId) {
      const appointment = await db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.id, validatedData.appointmentId),
          eq(appointments.clinicId, id),
          isNull(appointments.deletedAt)
        ))
        .limit(1);

      if (appointment.length === 0) {
        return NextResponse.json(
          {
            error: 'Appointment not found or does not belong to this clinic',
            code: 'APPOINTMENT_NOT_FOUND',
          },
          { status: 404 }
        );
      }
    }

    // Calculate balance amount
    const subtotal = parseFloat(validatedData.subtotal);
    const taxAmount = parseFloat(validatedData.taxAmount);
    const discountAmount = parseFloat(validatedData.discountAmount);
    const totalAmount = parseFloat(validatedData.totalAmount);
    const balanceAmount = totalAmount; // Initially, balance equals total amount

    const newInvoice = await db
      .insert(invoices)
      .values({
        clinicId: id,
        ...validatedData,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        discountAmount: discountAmount.toString(),
        totalAmount: totalAmount.toString(),
        balanceAmount: balanceAmount.toString(),
      })
      .returning();

    // Audit logging
    await logAudit({
      action: 'CREATE_INVOICE',
      entityType: 'invoice',
      entityId: newInvoice[0].id,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: newInvoice[0],
    });

    return NextResponse.json(
      {
        data: newInvoice[0],
        message: 'Invoice created successfully',
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
        error: error instanceof Error ? error.message : 'Failed to create invoice',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const invoiceId = url.pathname.split('/').pop();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required', code: 'MISSING_INVOICE_ID' },
        { status: 400 }
      );
    }

    // Validate tenant scope + permission (invoices:delete)
    const tenantCheck = await validateTenantScope(request, id, 'invoices', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    // Soft delete the invoice
    const deletedInvoice = await db
      .update(invoices)
      .set({
        deletedAt: new Date(),
      })
      .where(and(
        eq(invoices.id, invoiceId),
        eq(invoices.clinicId, id),
        isNull(invoices.deletedAt)
      ))
      .returning();

    if (deletedInvoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found or already deleted', code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Audit logging
    await logAudit({
      action: 'UPDATE_INVOICE',
      entityType: 'invoice',
      entityId: invoiceId,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: deletedInvoice[0],
    });

    return NextResponse.json(
      {
        message: 'Invoice deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete invoice',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
