import { db } from '@/db';
import { appointments, clinics, patients } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get total clinics count
    const clinicsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(clinics);

    // Get active clinics count
    const activeClinicsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(clinics)
      .where(eq(clinics.isActive, true));

    // Get total patients count
    const patientsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients);

    // Get total appointments count
    const appointmentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments);

    return NextResponse.json({
      data: {
        totalClinics: clinicsCount[0]?.count || 0,
        activeClinics: activeClinicsCount[0]?.count || 0,
        totalPatients: patientsCount[0]?.count || 0,
        totalAppointments: appointmentsCount[0]?.count || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
