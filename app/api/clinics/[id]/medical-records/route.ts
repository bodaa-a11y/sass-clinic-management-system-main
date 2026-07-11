import { z } from 'zod';
import { db } from '@/db';
import { medicalRecords, clinics, patients, users, appointments } from '@/db/schema';
import { medicalRecordSchema } from '@/lib/validations';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq, and, isNull, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params;

    // Validate tenant scope + permission (medical_records:read)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const appointmentId = searchParams.get('appointmentId');

    // Build WHERE conditions
    const conditions = [
      eq(medicalRecords.clinicId, clinicId),
      isNull(medicalRecords.deletedAt)
    ];

    if (patientId) {
      conditions.push(eq(medicalRecords.patientId, patientId));
    }
    if (doctorId) {
      conditions.push(eq(medicalRecords.doctorId, doctorId));
    }
    if (appointmentId) {
      conditions.push(eq(medicalRecords.appointmentId, appointmentId));
    }

    // Query with JOINs to get patient and doctor names
    const allRecords = await db
      .select({
        id: medicalRecords.id,
        clinicId: medicalRecords.clinicId,
        patientId: medicalRecords.patientId,
        doctorId: medicalRecords.doctorId,
        appointmentId: medicalRecords.appointmentId,
        chiefComplaint: medicalRecords.chiefComplaint,
        diagnosis: medicalRecords.diagnosis,
        symptoms: medicalRecords.symptoms,
        clinicalNotes: medicalRecords.clinicalNotes,
        vitalSigns: medicalRecords.vitalSigns,
        treatmentPlan: medicalRecords.treatmentPlan,
        followUpDate: medicalRecords.followUpDate,
        createdAt: medicalRecords.createdAt,
        updatedAt: medicalRecords.updatedAt,
        patientName: patients.fullName,
        doctorName: users.name,
        appointmentDate: appointments.appointmentDate,
      })
      .from(medicalRecords)
      .leftJoin(patients, eq(medicalRecords.patientId, patients.id))
      .leftJoin(users, eq(medicalRecords.doctorId, users.id))
      .leftJoin(appointments, eq(medicalRecords.appointmentId, appointments.id))
      .where(and(...conditions))
      .orderBy(medicalRecords.createdAt);

    return NextResponse.json({
      data: allRecords,
      count: allRecords.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch medical records',
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

    // Validate tenant scope + permission (medical_records:create)
    const tenantCheck = await validateTenantScope(request, id, 'medical-records', 'POST');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();
    const validatedData = medicalRecordSchema.parse(body);

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

    // Validate doctor exists and belongs to clinic
    const doctor = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, validatedData.doctorId),
        eq(users.clinicId, id),
        or(eq(users.role, 'doctor'), eq(users.role, 'clinic_admin')),
        eq(users.isActive, true),
        isNull(users.deletedAt)
      ))
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        {
          error: 'Doctor not found, inactive, or does not belong to this clinic',
          code: 'DOCTOR_NOT_FOUND',
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

    const newRecord = await db
      .insert(medicalRecords)
      .values({
        clinicId: id,
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId,
        appointmentId: validatedData.appointmentId,
        chiefComplaint: validatedData.chiefComplaint || 'زيارة طبية',
        diagnosis: validatedData.diagnosis,
        symptoms: validatedData.symptoms,
        clinicalNotes: validatedData.clinicalNotes,
        vitalSigns: validatedData.vitalSigns,
        treatmentPlan: validatedData.treatmentPlan,
        followUpDate: validatedData.followUpDate,
        isActive: true,
        deletedAt: null,
      })
      .returning();

    // Audit logging
    await logAudit({
      action: 'CREATE_MEDICAL_RECORD',
      entityType: 'medicalRecord',
      entityId: newRecord[0].id,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: newRecord[0],
    });

    return NextResponse.json(
      {
        data: newRecord[0],
        message: 'Medical record created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create medical record',
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
    const recordId = new URL(request.url).searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required', code: 'MISSING_RECORD_ID' },
        { status: 400 }
      );
    }

    // Validate tenant scope + permission (medical_records:delete)
    const tenantCheck = await validateTenantScope(request, id, 'medical-records', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    // Soft delete the medical record
    const deletedRecord = await db
      .update(medicalRecords)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(and(
        eq(medicalRecords.id, recordId),
        eq(medicalRecords.clinicId, id),
        isNull(medicalRecords.deletedAt)
      ))
      .returning();

    if (deletedRecord.length === 0) {
      return NextResponse.json(
        { error: 'Medical record not found or already deleted', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Audit logging
    await logAudit({
      action: 'UPDATE_MEDICAL_RECORD',
      entityType: 'medical_record',
      entityId: recordId,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: deletedRecord[0],
    });

    return NextResponse.json(
      {
        message: 'Medical record deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete medical record',
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
    const { id } = await params;
    const url = new URL(request.url);
    const recordId = url.pathname.split('/').pop();

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required', code: 'MISSING_RECORD_ID' },
        { status: 400 }
      );
    }

    // Validate tenant scope + permission (medical_records:edit)
    const tenantCheck = await validateTenantScope(request, id, 'medical_records', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();

    // Validate body
    if (!body.chiefComplaint || !body.diagnosis) {
      return NextResponse.json(
        { error: 'Chief complaint and diagnosis are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Get current record for audit
    const currentRecord = await db
      .select()
      .from(medicalRecords)
      .where(and(
        eq(medicalRecords.id, recordId),
        eq(medicalRecords.clinicId, id),
        isNull(medicalRecords.deletedAt)
      ))
      .limit(1);

    if (currentRecord.length === 0) {
      return NextResponse.json(
        { error: 'Medical record not found', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update medical record
    const updatedRecord = await db
      .update(medicalRecords)
      .set({
        patientId: body.patientId || currentRecord[0].patientId,
        doctorId: body.doctorId || currentRecord[0].doctorId,
        chiefComplaint: body.chiefComplaint,
        diagnosis: body.diagnosis,
        symptoms: body.symptoms || null,
        clinicalNotes: body.clinicalNotes || null,
        treatmentPlan: body.treatmentPlan || null,
        followUpDate: body.followUpDate || null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(medicalRecords.id, recordId),
        eq(medicalRecords.clinicId, id),
        isNull(medicalRecords.deletedAt)
      ))
      .returning();

    // Audit logging
    await logAudit({
      action: 'UPDATE_MEDICAL_RECORD',
      entityType: 'medical_record',
      entityId: recordId,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: currentRecord[0],
      newValues: updatedRecord[0],
    });

    return NextResponse.json(
      {
        data: updatedRecord[0],
        message: 'Medical record updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Medical Records PATCH] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update medical record',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
