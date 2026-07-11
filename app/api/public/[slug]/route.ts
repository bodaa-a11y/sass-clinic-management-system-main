import { db } from '@/db';
import { clinics, users, specialties } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get clinic by slug
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, slug))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get active doctors for this clinic with specialty info
    const doctors = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        specialtyId: users.specialtyId,
        specialtyName: specialties.name,
      })
      .from(users)
      .leftJoin(specialties, eq(users.specialtyId, specialties.id))
      .where(
        and(
          eq(users.clinicId, clinic[0].id),
          eq(users.role, 'doctor'),
          eq(users.isActive, true)
        )
      );

    // Get specialties for this clinic
    const specialtiesList = await db
      .select()
      .from(specialties)
      .where(eq(specialties.clinicId, clinic[0].id))
      .orderBy(specialties.name);

    return NextResponse.json({
      data: {
        clinic: {
          id: clinic[0].id,
          name: clinic[0].name,
          phone: clinic[0].phone,
          slug: clinic[0].slug,
        },
        doctors,
        specialties: specialtiesList,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch clinic', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
