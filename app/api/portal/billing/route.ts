import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const patientId = request.headers.get('x-patient-id');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID required', code: 'MISSING_PATIENT_ID' },
        { status: 401 }
      );
    }

    // Fetch invoices for this patient
    const invoicesList = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        patientId: invoices.patientId,
        appointmentId: invoices.appointmentId,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        balanceAmount: invoices.balanceAmount,
        status: invoices.status,
        paymentMethod: invoices.paymentMethod,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.patientId, patientId),
          isNull(invoices.deletedAt)
        )
      )
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json(
      { invoices: invoicesList },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
