import { db } from '@/db';
import { appointments, clinics, patients, users, medicalRecords, prescriptions, invoices } from '@/db/schema';
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';

const updatePatientSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    const { id, patientId } = await params;

    // Validate tenant scope + permission (patients:read)
    const tenantCheck = await validateTenantScope(request, id, 'patients', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    // Get patient details
    const patient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.clinicId, id),
          isNull(patients.deletedAt)
        )
      )
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json(
        {
          error: 'Patient not found',
          code: 'PATIENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Get all appointments for this patient with doctor info
    const patientAppointments = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        doctorId: appointments.doctorId,
        doctorName: users.name,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .where(
        and(
          eq(appointments.patientId, patientId),
          eq(appointments.clinicId, id),
          isNull(appointments.deletedAt)
        )
      )
      .orderBy(desc(appointments.appointmentDate));

    // Calculate statistics
    const totalVisits = patientAppointments.length;
    const cancelledCount = patientAppointments.filter(a => a.status === 'cancelled').length;
    const lastVisit = patientAppointments.find(a => a.status !== 'cancelled');

    // Get medical records for this patient
    const patientMedicalRecords = await db
      .select({
        id: medicalRecords.id,
        patientId: medicalRecords.patientId,
        doctorId: medicalRecords.doctorId,
        chiefComplaint: medicalRecords.chiefComplaint,
        diagnosis: medicalRecords.diagnosis,
        symptoms: medicalRecords.symptoms,
        clinicalNotes: medicalRecords.clinicalNotes,
        treatmentPlan: medicalRecords.treatmentPlan,
        followUpDate: medicalRecords.followUpDate,
        createdAt: medicalRecords.createdAt,
        doctorName: users.name,
      })
      .from(medicalRecords)
      .leftJoin(users, eq(medicalRecords.doctorId, users.id))
      .where(
        and(
          eq(medicalRecords.patientId, patientId),
          eq(medicalRecords.clinicId, id),
          isNull(medicalRecords.deletedAt)
        )
      )
      .orderBy(desc(medicalRecords.createdAt));

    // Get prescriptions for each medical record
    const recordIds = patientMedicalRecords.map(r => r.id);
    const allPrescriptions = recordIds.length > 0
      ? await db
        .select({
          id: prescriptions.id,
          medicalRecordId: prescriptions.medicalRecordId,
          medicationName: prescriptions.medicationName,
          dosage: prescriptions.dosage,
          frequency: prescriptions.frequency,
          duration: prescriptions.duration,
          instructions: prescriptions.instructions,
        })
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.clinicId, id),
            isNull(prescriptions.deletedAt),
            or(...recordIds.map(id => eq(prescriptions.medicalRecordId, id)))
          )
        )
      : [];

    // Group prescriptions by medical record ID
    const prescriptionsByRecord: Record<string, any[]> = {};
    allPrescriptions.forEach(prescription => {
      if (!prescriptionsByRecord[prescription.medicalRecordId]) {
        prescriptionsByRecord[prescription.medicalRecordId] = [];
      }
      prescriptionsByRecord[prescription.medicalRecordId].push(prescription);
    });

    // Add prescriptions to medical records
    const medicalRecordsWithPrescriptions = patientMedicalRecords.map(record => ({
      ...record,
      prescriptions: prescriptionsByRecord[record.id] || [],
    }));

    // Get financial summary
    const patientInvoices = await db
      .select({
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        balanceAmount: invoices.balanceAmount,
        status: invoices.status,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.patientId, patientId),
          eq(invoices.clinicId, id),
          isNull(invoices.deletedAt)
        )
      );

    const totalInvoiceAmount = patientInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
    const totalPaidAmount = patientInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || '0'), 0);
    const totalBalanceAmount = patientInvoices.reduce((sum, inv) => sum + parseFloat(inv.balanceAmount || '0'), 0);
    const invoiceCount = patientInvoices.length;

    return NextResponse.json({
      data: {
        patient: patient[0],
        appointments: patientAppointments,
        medicalRecords: medicalRecordsWithPrescriptions,
        financialSummary: {
          totalAmount: totalInvoiceAmount.toFixed(2),
          paidAmount: totalPaidAmount.toFixed(2),
          balanceAmount: totalBalanceAmount.toFixed(2),
          invoiceCount,
        },
        stats: {
          totalVisits,
          cancelledCount,
          lastVisitDate: lastVisit?.appointmentDate || null,
          medicalRecordsCount: patientMedicalRecords.length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch patient profile',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    const { id, patientId } = await params;

    // Validate tenant scope + permission (patients:update)
    const tenantCheck = await validateTenantScope(request, id, 'patients', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    // Check patient exists
    const existingPatient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.clinicId, id),
          isNull(patients.deletedAt)
        )
      )
      .limit(1);

    if (existingPatient.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found', code: 'PATIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate input
    const body = await request.json();
    const validatedData = updatePatientSchema.parse(body);

    // Update patient
    const updatedPatient = await db
      .update(patients)
      .set({
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email || null,
        dateOfBirth: validatedData.dateOfBirth || null,
        gender: validatedData.gender || null,
        address: validatedData.address || null,
        emergencyContact: validatedData.emergencyContact || null,
        medicalHistory: validatedData.medicalHistory || null,
        allergies: validatedData.allergies || null,
      })
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.clinicId, id),
          isNull(patients.deletedAt)
        )
      )
      .returning();

    // Audit logging
    await logAudit({
      action: 'UPDATE_PATIENT',
      entityType: 'patient',
      entityId: patientId,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: existingPatient[0],
      newValues: updatedPatient[0],
    });

    return NextResponse.json({
      data: updatedPatient[0],
      message: 'تم تحديث بيانات المريض بنجاح',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update patient', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    const { id, patientId } = await params;

    // Validate tenant scope + permission (patients:delete)
    const tenantCheck = await validateTenantScope(request, id, 'patients', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

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

    // Check patient exists
    const existingPatient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.clinicId, id),
          isNull(patients.deletedAt)
        )
      )
      .limit(1);

    if (existingPatient.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found or already deleted', code: 'PATIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete the patient
    const deletedPatient = await db
      .update(patients)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.clinicId, id),
          isNull(patients.deletedAt)
        )
      )
      .returning();

    // Audit logging
    await logAudit({
      action: 'DELETE_PATIENT',
      entityType: 'patient',
      entityId: patientId,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: deletedPatient[0],
    });

    return NextResponse.json({
      message: 'تم حذف المريض بنجاح',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete patient', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
