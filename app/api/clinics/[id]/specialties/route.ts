import { db } from '@/db';
import { specialties, clinics } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateTenantScope, getUserContext } from '@/lib/tenant';

const createSpecialtySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  icon: z.string().max(10).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Allow any authenticated user in the same clinic to view specialties
    // This is needed for dropdowns in appointment booking and staff management
    const userContext = await getUserContext(request);
    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Verify user belongs to this clinic (unless super_admin)
    if (userContext.userRole !== 'super_admin' && userContext.clinicId !== id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own clinic data', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const specialtiesList = await db
      .select()
      .from(specialties)
      .where(eq(specialties.clinicId, id))
      .orderBy(specialties.name);

    return NextResponse.json({ data: specialtiesList });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch specialties', code: 'FETCH_ERROR' },
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

    // Validate tenant scope for specialties module
    const tenantCheck = await validateTenantScope(request, id, 'specialties', 'POST');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const body = await request.json();
    const validatedData = createSpecialtySchema.parse(body);

    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingSpecialty = await db
      .select()
      .from(specialties)
      .where(
        and(
          eq(specialties.clinicId, id),
          eq(specialties.name, validatedData.name)
        )
      )
      .limit(1);

    if (existingSpecialty.length > 0) {
      return NextResponse.json(
        { error: 'Specialty already exists', code: 'DUPLICATE_SPECIALTY' },
        { status: 409 }
      );
    }

    const newSpecialty = await db
      .insert(specialties)
      .values({
        clinicId: id,
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
      })
      .returning();

    return NextResponse.json(
      { data: newSpecialty[0], message: 'Specialty added successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add specialty', code: 'CREATE_ERROR' },
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

    // Validate tenant scope for specialties module
    const tenantCheck = await validateTenantScope(request, id, 'specialties', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get('specialty_id');

    if (!specialtyId) {
      return NextResponse.json(
        { error: 'specialty_id query parameter is required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const specialty = await db
      .select()
      .from(specialties)
      .where(
        and(
          eq(specialties.id, specialtyId),
          eq(specialties.clinicId, id)
        )
      )
      .limit(1);

    if (specialty.length === 0) {
      return NextResponse.json(
        { error: 'Specialty not found', code: 'SPECIALTY_NOT_FOUND' },
        { status: 404 }
      );
    }

    await db
      .delete(specialties)
      .where(eq(specialties.id, specialtyId));

    return NextResponse.json(
      { message: 'Specialty deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete specialty', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}