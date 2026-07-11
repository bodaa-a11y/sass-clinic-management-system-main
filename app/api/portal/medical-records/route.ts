import { db } from '@/db';
import { medicalRecords, users, consultations } from '@/db/schema';
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

    // Fetch medical records for this patient
    const records = await db
      .select({
        id: medicalRecords.id,
        appointmentId: medicalRecords.appointmentId,
        chiefComplaint: medicalRecords.chiefComplaint,
        diagnosis: medicalRecords.diagnosis,
        symptoms: medicalRecords.symptoms,
        clinicalNotes: medicalRecords.clinicalNotes,
        vitalSigns: medicalRecords.vitalSigns,
        treatmentPlan: medicalRecords.treatmentPlan,
        followUpDate: medicalRecords.followUpDate,
        doctorId: medicalRecords.doctorId,
        createdAt: medicalRecords.createdAt,
      })
      .from(medicalRecords)
      .where(
        and(
          eq(medicalRecords.patientId, patientId),
          isNull(medicalRecords.deletedAt)
        )
      )
      .orderBy(desc(medicalRecords.createdAt));

    // Fetch doctor information for each record
    const doctorIds = [...new Set(records.map(r => r.doctorId))];

    let doctors: Array<{ id: string; name: string | null }> = [];
    if (doctorIds.length > 0) {
      doctors = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, doctorIds[0])); // This will need to be updated to handle multiple doctors
    }

    // Map doctors to records
    const recordsWithDoctors = records.map(record => {
      const doctor = doctors.find(d => d.id === record.doctorId);
      return {
        ...record,
        doctor: doctor || {
          name: 'غير محدد',
        },
      };
    });

    return NextResponse.json(
      { records: recordsWithDoctors },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch medical records error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
