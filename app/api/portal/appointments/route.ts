import { db } from '@/db';
import { appointments, users, patients, specialties } from '@/db/schema';
import { eq, desc, and, isNull, inArray } from 'drizzle-orm';
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

    // Fetch appointments for this patient
    const appointmentsList = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        priority: appointments.priority,
        notes: appointments.notes,
        doctorId: appointments.doctorId,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patientId),
          isNull(appointments.deletedAt)
        )
      )
      .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime));

    // Fetch doctor information for each appointment
    const doctorIds = [...new Set(appointmentsList.map(a => a.doctorId))];

    let doctors: Array<{ id: string; name: string | null; specialtyId: string | null }> = [];
    if (doctorIds.length > 0) {
      doctors = await db
        .select({
          id: users.id,
          name: users.name,
          specialtyId: users.specialtyId,
        })
        .from(users)
        .where(inArray(users.id, doctorIds));
    }

    // Fetch specialty information
    const specialtyIds = [...new Set(doctors.filter(d => d.specialtyId).map(d => d.specialtyId!))];
    let specialtyData: Array<{ id: string; name: string }> = [];
    if (specialtyIds.length > 0) {
      specialtyData = await db
        .select({
          id: specialties.id,
          name: specialties.name,
        })
        .from(specialties)
        .where(inArray(specialties.id, specialtyIds));
    }

    // Map doctors and specialties to appointments
    const appointmentsWithDoctors = appointmentsList.map(appointment => {
      const doctor = doctors.find(d => d.id === appointment.doctorId);
      const specialty = doctor?.specialtyId
        ? specialtyData.find(s => s.id === doctor.specialtyId)
        : null;

      return {
        ...appointment,
        doctor: doctor || {
          name: 'غير محدد',
          specialtyId: null,
        },
        specialty: specialty || {
          name: null,
        },
      };
    });

    return NextResponse.json(
      { appointments: appointmentsWithDoctors },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch appointments error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
