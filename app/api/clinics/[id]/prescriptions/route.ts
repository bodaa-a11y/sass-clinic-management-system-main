import { z } from 'zod';
import { db } from '@/db';
import { prescriptions, medicalRecords, clinics, patients, users, appointments } from '@/db/schema';
import { prescriptionSchema } from '@/lib/validations';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { eq, and, isNull, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params;

    // Validate tenant scope + permission (prescriptions:read)
    const tenantCheck = await validateTenantScope(request, clinicId, 'prescriptions', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const medicalRecordId = searchParams.get('medicalRecordId');
    const status = searchParams.get('status');

    // Build WHERE conditions
    const conditions = [
      eq(prescriptions.clinicId, clinicId),
      isNull(prescriptions.deletedAt)
    ];

    // Role-based filtering: Doctors see only their own prescriptions
    if (context.userRole === 'doctor') {
      conditions.push(eq(prescriptions.doctorId, context.userId));
    }

    if (patientId) {
      conditions.push(eq(prescriptions.patientId, patientId));
    }
    if (doctorId) {
      conditions.push(eq(prescriptions.doctorId, doctorId));
    }
    if (medicalRecordId) {
      conditions.push(eq(prescriptions.medicalRecordId, medicalRecordId));
    }
    if (status) {
      conditions.push(eq(prescriptions.status, status as 'active' | 'completed' | 'discontinued'));
    }

    // Query with JOINs to get patient and doctor names
    const allPrescriptions = await db
      .select({
        id: prescriptions.id,
        clinicId: prescriptions.clinicId,
        medicalRecordId: prescriptions.medicalRecordId,
        patientId: prescriptions.patientId,
        doctorId: prescriptions.doctorId,
        medicationName: prescriptions.medicationName,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        instructions: prescriptions.instructions,
        status: prescriptions.status,
        createdAt: prescriptions.createdAt,
        updatedAt: prescriptions.updatedAt,
        patientName: patients.fullName,
        doctorName: users.name,
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .leftJoin(users, eq(prescriptions.doctorId, users.id))
      .leftJoin(medicalRecords, eq(prescriptions.medicalRecordId, medicalRecords.id))
      .where(and(...conditions))
      .orderBy(prescriptions.createdAt);

    return NextResponse.json({
      data: allPrescriptions,
      count: allPrescriptions.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch prescriptions',
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
    const { id: clinicId } = await params;

    // Validate tenant scope + permission (prescriptions:create)
    const tenantCheck = await validateTenantScope(request, clinicId, 'prescriptions', 'POST');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const body = await request.json();

    // Validate required fields
    if (!body.medicalRecordId || !body.patientId || !body.doctorId || !body.medications) {
      return NextResponse.json(
        { error: 'Missing required fields: medicalRecordId, patientId, doctorId, medications' },
        { status: 400 }
      );
    }

    // Validate medical record exists and belongs to clinic
    const medicalRecord = await db
      .select()
      .from(medicalRecords)
      .where(and(
        eq(medicalRecords.id, body.medicalRecordId),
        eq(medicalRecords.clinicId, clinicId),
        isNull(medicalRecords.deletedAt)
      ))
      .limit(1);

    if (medicalRecord.length === 0) {
      console.error('Prescription POST - Medical record not found:', {
        medicalRecordId: body.medicalRecordId,
        clinicId,
        patientId: body.patientId,
        doctorId: body.doctorId,
      });
      return NextResponse.json(
        {
          error: 'Medical record not found or does not belong to this clinic',
          code: 'MEDICAL_RECORD_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Validate patient exists and belongs to clinic
    const patient = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, body.patientId),
        eq(patients.clinicId, clinicId),
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

    // Validate doctor exists and belongs to clinic
    const doctor = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, body.doctorId),
        eq(users.clinicId, clinicId),
        eq(users.role, 'doctor'),
        isNull(users.deletedAt)
      ))
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        {
          error: 'Doctor not found or does not belong to this clinic',
          code: 'DOCTOR_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const newPrescription = await db
      .insert(prescriptions)
      .values({
        clinicId: clinicId,
        patientId: body.patientId,
        doctorId: body.doctorId,
        medicalRecordId: body.medicalRecordId,
        medicationName: body.medications?.split('\n')[0] || 'أدوية متعددة',
        dosage: 'حسب التعليمات',
        frequency: 'حسب التعليمات',
        duration: 'حسب التعليمات',
        instructions: body.instructions,
        status: body.status || 'active',
        isActive: true,
      })
      .returning();

    // Audit logging
    await logAudit({
      action: 'CREATE_PRESCRIPTION',
      entityType: 'prescription',
      entityId: newPrescription[0].id,
      clinicId: clinicId,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: newPrescription[0],
    });

    return NextResponse.json(
      {
        data: newPrescription[0],
        message: 'Prescription created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create prescription',
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
    const { id: clinicId } = await params;

    // Validate tenant scope + permission (prescriptions:delete)
    const tenantCheck = await validateTenantScope(request, clinicId, 'prescriptions', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const prescriptionId = new URL(request.url).searchParams.get('prescriptionId');

    if (!prescriptionId) {
      return NextResponse.json(
        { error: 'Prescription ID is required', code: 'MISSING_PRESCRIPTION_ID' },
        { status: 400 }
      );
    }

    // Soft delete the prescription
    const deletedPrescription = await db
      .update(prescriptions)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(and(
        eq(prescriptions.id, prescriptionId),
        eq(prescriptions.clinicId, clinicId),
        isNull(prescriptions.deletedAt)
      ))
      .returning();

    if (deletedPrescription.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found or already deleted', code: 'PRESCRIPTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Audit logging
    await logAudit({
      action: 'DELETE_PRESCRIPTION',
      entityType: 'prescription',
      entityId: prescriptionId,
      clinicId: clinicId,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: deletedPrescription[0],
    });

    return NextResponse.json(
      {
        message: 'Prescription deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete prescription',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params;

    // Validate tenant scope + permission (prescriptions:edit)
    const tenantCheck = await validateTenantScope(request, clinicId, 'prescriptions', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const url = new URL(request.url);
    const prescriptionId = url.pathname.split('/').pop();

    if (!prescriptionId) {
      return NextResponse.json(
        { error: 'Prescription ID is required', code: 'MISSING_PRESCRIPTION_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate body
    if (!body.medicationName || !body.dosage || !body.frequency || !body.duration) {
      return NextResponse.json(
        { error: 'Medication name, dosage, frequency, and duration are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Get current prescription
    const currentPrescription = await db
      .select()
      .from(prescriptions)
      .where(and(
        eq(prescriptions.id, prescriptionId),
        eq(prescriptions.clinicId, clinicId),
        isNull(prescriptions.deletedAt)
      ))
      .limit(1);

    if (currentPrescription.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found', code: 'PRESCRIPTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update prescription
    const updatedPrescription = await db
      .update(prescriptions)
      .set({
        medicationName: body.medicationName,
        dosage: body.dosage,
        frequency: body.frequency,
        duration: body.duration,
        instructions: body.instructions || null,
      })
      .where(and(
        eq(prescriptions.id, prescriptionId),
        eq(prescriptions.clinicId, clinicId),
        isNull(prescriptions.deletedAt)
      ))
      .returning();

    // Audit logging
    await logAudit({
      action: 'UPDATE_PRESCRIPTION',
      entityType: 'prescription',
      entityId: prescriptionId,
      clinicId: clinicId,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: currentPrescription[0],
      newValues: updatedPrescription[0],
    });

    return NextResponse.json(
      {
        data: updatedPrescription[0],
        message: 'Prescription updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update prescription',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
