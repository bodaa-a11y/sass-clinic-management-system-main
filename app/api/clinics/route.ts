import { db } from '@/db';
import { clinics } from '@/db/schema';
import { clinicSchema } from '@/lib/validations';
import { count, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const allClinics = await db.select().from(clinics);
    const totalCount = await db.select({ count: count() }).from(clinics);

    return NextResponse.json({
      data: allClinics,
      count: totalCount[0]?.count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch clinics',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = clinicSchema.parse(body);

    const existingClinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, validatedData.slug))
      .limit(1);

    if (existingClinic.length > 0) {
      return NextResponse.json(
        {
          error: 'A clinic with this slug already exists',
          code: 'DUPLICATE_SLUG',
        },
        { status: 409 }
      );
    }

    const newClinic = await db
      .insert(clinics)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        phone: validatedData.phone,
      })
      .returning();

    return NextResponse.json(
      {
        data: newClinic[0],
        message: 'Clinic created successfully',
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
        error: error instanceof Error ? error.message : 'Failed to create clinic',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}
