import { db } from '@/db';
import { clinics } from '@/db/schema';
import { clinicUpdateSchema } from '@/lib/validations';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate tenant scope + permission (settings:read)
    const tenantCheck = await validateTenantScope(request, id, 'clinic', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    let clinic;
    try {
      clinic = await db
        .select()
        .from(clinics)
        .where(eq(clinics.id, id))
        .limit(1);
    } catch (error) {
      // If migration not run yet, columns don't exist
      return NextResponse.json(
        {
          error: 'Database schema not updated. Please run migration.',
          code: 'MIGRATION_REQUIRED',
        },
        { status: 500 }
      );
    }

    if (clinic.length === 0) {
      return NextResponse.json(
        {
          error: 'Clinic not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Return clinic config for client-side refresh
    const clinicConfig = {
      facilityType: clinic[0].facilityType,
      edition: clinic[0].edition,
      enabledModules: clinic[0].enabledModules as string[],
      config: clinic[0].config as Record<string, any>,
    };

    return NextResponse.json({
      data: clinic[0],
      clinicConfig, // Include for client-side refresh
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch clinic',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate tenant scope + permission (settings:update)
    const tenantCheck = await validateTenantScope(request, id, 'clinic', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const existingClinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (existingClinic.length === 0) {
      return NextResponse.json(
        {
          error: 'Clinic not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = clinicUpdateSchema.parse(body);

    if (validatedData.slug) {
      const slugExists = await db
        .select()
        .from(clinics)
        .where(eq(clinics.slug, validatedData.slug))
        .limit(1);

      if (slugExists.length > 0 && slugExists[0].id !== id) {
        return NextResponse.json(
          {
            error: 'A clinic with this slug already exists',
            code: 'DUPLICATE_SLUG',
          },
          { status: 409 }
        );
      }
    }

    const updateData: Partial<typeof clinics.$inferInsert> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;

    const updatedClinic = await db
      .update(clinics)
      .set(updateData)
      .where(eq(clinics.id, id))
      .returning();

    // Audit logging
    await logAudit({
      action: 'UPDATE_SETTINGS',
      entityType: 'clinic',
      entityId: id,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: existingClinic[0],
      newValues: updatedClinic[0],
    });

    return NextResponse.json({
      data: updatedClinic[0],
      message: 'Clinic updated successfully',
    });
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
        error: error instanceof Error ? error.message : 'Failed to update clinic',
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

    const existingClinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (existingClinic.length === 0) {
      return NextResponse.json(
        {
          error: 'Clinic not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    await db.delete(clinics).where(eq(clinics.id, id));

    return NextResponse.json({
      message: 'Clinic deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete clinic',
        code: 'DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
