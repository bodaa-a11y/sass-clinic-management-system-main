import { db } from '@/db';
import { clinics, patients, appointments } from '@/db/schema';
import { patientSchema } from '@/lib/validations';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate tenant scope + permission (patients:read)
    const tenantCheck = await validateTenantScope(request, id, 'patients', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;

    let allPatients: typeof patients.$inferSelect[];

    // Role-based filtering: Doctors see only patients they have appointments with
    if (context.userRole === 'doctor') {
      // Get patient IDs from appointments with this doctor
      const doctorAppointments = await db
        .select({ patientId: appointments.patientId })
        .from(appointments)
        .where(and(
          eq(appointments.clinicId, id),
          eq(appointments.doctorId, context.userId),
          isNull(appointments.deletedAt)
        ));

      const patientIds = doctorAppointments.map(a => a.patientId);

      if (patientIds.length === 0) {
        // No patients yet
        allPatients = [];
      } else {
        allPatients = await db
          .select()
          .from(patients)
          .where(and(
            eq(patients.clinicId, id),
            inArray(patients.id, patientIds),
            isNull(patients.deletedAt)
          ));
      }
    } else {
      // Receptionists and admins see all clinic patients
      allPatients = await db
        .select()
        .from(patients)
        .where(and(
          eq(patients.clinicId, id),
          isNull(patients.deletedAt)
        ));
    }

    return NextResponse.json({
      data: allPatients,
      count: allPatients.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch patients',
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

    // Validate tenant scope + permission (patients:create)
    const tenantCheck = await validateTenantScope(request, id, 'patients', 'POST');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();
    const validatedData = patientSchema.parse(body);

    const newPatient = await db
      .insert(patients)
      .values({
        clinicId: id,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email || null,
        dateOfBirth: body.dateOfBirth || null,
        gender: body.gender || null,
        address: body.address || null,
        allergies: body.allergies || null,
        isActive: true,
        deletedAt: null,
      })
      .returning();

    // Log audit for patient creation
    await logAudit({
      action: 'CREATE_PATIENT',
      entityType: 'patient',
      entityId: newPatient[0].id,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: newPatient[0],
    });

    return NextResponse.json(
      {
        data: newPatient[0],
        message: 'Patient created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
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
        error: error instanceof Error ? error.message : 'Failed to create patient',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const patientId = url.pathname.split('/').pop();

    if (!patientId) {
      return NextResponse.json(
        {
          error: 'Patient ID is required',
          code: 'MISSING_PATIENT_ID',
        },
        { status: 400 }
      );
    }

    // Verify clinic exists
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        {
          error: 'Clinic not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Verify patient exists and belongs to this clinic
    const existingPatient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (existingPatient.length === 0) {
      return NextResponse.json(
        {
          error: 'Patient not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = patientSchema.parse(body);

    const updatedPatient = await db
      .update(patients)
      .set({
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
      })
      .where(eq(patients.id, patientId))
      .returning();

    return NextResponse.json(
      {
        data: updatedPatient[0],
        message: 'Patient updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
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
        error: error instanceof Error ? error.message : 'Failed to update patient',
        code: 'UPDATE_ERROR',
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
    const patientId = url.pathname.split('/').pop();

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required', code: 'MISSING_PATIENT_ID' },
        { status: 400 }
      );
    }

    // Validate tenant scope + permission (patients:delete)
    const tenantCheck = await validateTenantScope(request, id, 'patients', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    // Soft delete the patient
    const deletedPatient = await db
      .update(patients)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(and(
        eq(patients.id, patientId),
        eq(patients.clinicId, id),
        isNull(patients.deletedAt)
      ))
      .returning();

    if (deletedPatient.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found or already deleted', code: 'PATIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      {
        message: 'Patient deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete patient',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
