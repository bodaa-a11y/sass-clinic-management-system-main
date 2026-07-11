import { db } from '@/db';
import { prescriptions, users, prescriptionRefillRequests } from '@/db/schema';
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

    // Fetch prescriptions for this patient
    const prescriptionsList = await db
      .select({
        id: prescriptions.id,
        medicationName: prescriptions.medicationName,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        instructions: prescriptions.instructions,
        status: prescriptions.status,
        doctorId: prescriptions.doctorId,
        medicalRecordId: prescriptions.medicalRecordId,
        isActive: prescriptions.isActive,
        createdAt: prescriptions.createdAt,
      })
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.patientId, patientId),
          isNull(prescriptions.deletedAt)
        )
      )
      .orderBy(desc(prescriptions.createdAt));

    // Fetch doctor information
    const doctorIds = [...new Set(prescriptionsList.map(p => p.doctorId))];

    let doctors: Array<{ id: string; name: string | null }> = [];
    if (doctorIds.length > 0) {
      doctors = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, doctorIds[0])); // This will need to handle multiple doctors
    }

    // Map doctors to prescriptions
    const prescriptionsWithDoctors = prescriptionsList.map(prescription => {
      const doctor = doctors.find(d => d.id === prescription.doctorId);
      return {
        ...prescription,
        doctor: doctor || {
          name: 'غير محدد',
        },
      };
    });

    return NextResponse.json(
      { prescriptions: prescriptionsWithDoctors },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch prescriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
