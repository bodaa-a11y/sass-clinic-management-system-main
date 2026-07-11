/**
 * Start Consultation API Route
 * 
 * Creates a new consultation session or returns existing active one.
 * 
 * @module app/api/clinics/[id]/consultations/start/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/consultation-service';
import { validateTenantScope } from '@/lib/tenant';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/clinics/[id]/consultations/start
 * Start a new consultation session
 */
const POSTHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: clinicId } = await params;

    // Validate tenant scope + permission (medical-records:create)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'POST');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;

    const body = await request.json();
    const { appointmentId, patientId, doctorId } = body;

    if (!patientId || !doctorId) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, doctorId' },
        { status: 400 }
      );
    }

    // Check if there's already an active consultation for this appointment
    if (appointmentId) {
      const existing = await consultationService.getByAppointment(appointmentId);
      if (existing && existing.status !== 'completed' && existing.status !== 'cancelled') {
        return NextResponse.json({
          consultationId: existing.id,
          status: existing.status,
          isExisting: true
        });
      }
    }

    // Check if there's an active consultation for this patient
    const activeConsultation = await consultationService.getActiveByPatient(
      patientId,
      clinicId
    );

    if (activeConsultation) {
      return NextResponse.json({
        consultationId: activeConsultation.id,
        status: activeConsultation.status,
        isExisting: true
      });
    }

    // Check if there's an active consultation for this doctor
    const activeDoctorConsultation = await consultationService.getActiveByDoctor(
      doctorId,
      clinicId
    );

    if (activeDoctorConsultation) {
      // Fetch patient name for better error message
      const patient = await db
        .select({ fullName: patients.fullName })
        .from(patients)
        .where(eq(patients.id, activeDoctorConsultation.patientId))
        .limit(1);

      const patientName = patient[0]?.fullName || 'المريض';

      return NextResponse.json(
        {
          error: `لديك فحص جاري حالياً مع ${patientName}. يرجى إكمال الفحص الحالي قبل بدء فحص جديد.`,
          code: 'DOCTOR_HAS_ACTIVE_CONSULTATION',
          activeConsultationId: activeDoctorConsultation.id,
          patientName: patientName,
        },
        { status: 409 }
      );
    }

    // Create new consultation
    const consultation = await consultationService.create({
      clinicId,
      patientId,
      doctorId,
      appointmentId,
      status: 'in-progress',
    });

    return NextResponse.json({
      consultationId: consultation.id,
      status: consultation.status,
      isExisting: false
    });
  } catch (error) {
    console.error('Error starting consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const POST = POSTHandler;
