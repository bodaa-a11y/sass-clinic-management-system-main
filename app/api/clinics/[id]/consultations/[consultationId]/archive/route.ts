/**
 * Archive Consultation API Route
 * 
 * Completes consultation and archives it to medical record.
 * This is the Completion Protocol implementation.
 * 
 * @module app/api/clinics/[id]/consultations/[consultationId]/archive/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/consultation-service';
import { db } from '@/db';
import { medicalRecords, appointments } from '@/db/schema';
import { withTenantContext } from '@/lib/tenant-middleware';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * POST /api/clinics/[id]/consultations/[consultationId]/archive
 * Archive consultation to medical records
 */
const POSTHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) => {
  try {
    const { consultationId, id: clinicId } = await params;
    const body = await request.json();
    const { chiefComplaint, diagnosis, clinicalNotes, treatmentPlan } = body;

    // Get consultation
    const consultation = await consultationService.getById(consultationId);

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Verify tenant access
    if (consultation.clinicId !== clinicId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Note: Status is already updated to 'completed' by exam-service
    // This route only creates the medical record snapshot

    // Create medical record (snapshot)
    const values: any = {
      clinicId: consultation.clinicId,
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      appointmentId: consultation.appointmentId,
      chiefComplaint: chiefComplaint || consultation.chiefComplaint,
      diagnosis: diagnosis || consultation.diagnosis,
      symptoms: JSON.stringify(consultation.clinicalData?.vitals || {}),
      clinicalNotes: clinicalNotes || JSON.stringify(consultation.clinicalData),
      treatmentPlan: treatmentPlan,
      vitalSigns: JSON.stringify(consultation.clinicalData?.vitals || {}),
    };

    let medicalRecord;
    try {
      [medicalRecord] = await db.insert(medicalRecords).values(values as any).returning();
    } catch (dbError) {
      console.error('Error creating medical record:', dbError);
      return NextResponse.json(
        { error: 'Failed to create medical record', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Update appointment status from 'in-waiting-room' to 'done'
    if (consultation.appointmentId) {
      try {
        await db
          .update(appointments)
          .set({ status: 'done' })
          .where(
            and(
              eq(appointments.id, consultation.appointmentId),
              eq(appointments.clinicId, clinicId),
              isNull(appointments.deletedAt)
            )
          );
      } catch (updateError) {
        console.error('Error updating appointment status:', updateError);
        // Don't fail the entire operation if appointment update fails
        // Medical record was created successfully, so return success
      }
    }

    return NextResponse.json({
      success: true,
      medicalRecordId: medicalRecord.id,
    });
  } catch (error) {
    console.error('Error archiving consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const POST = withTenantContext(POSTHandler);
