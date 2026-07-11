import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clinics, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

/**
 * Refresh clinic config for logged-in user
 * Call this after Super Admin updates clinic settings
 */
export async function POST(request: NextRequest) {
  try {
    // Read token from httpOnly cookie instead of Authorization header
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Fetch user to get clinicId
    const user = await db
      .select({ clinicId: users.clinicId })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const clinicId = user[0].clinicId;

    if (!clinicId) {
      return NextResponse.json(
        { error: 'User not associated with a clinic', code: 'NO_CLINIC' },
        { status: 400 }
      );
    }

    // Fetch latest clinic config from database
    const clinic = await db
      .select({
        facilityType: clinics.facilityType,
        edition: clinics.edition,
        enabledModules: clinics.enabledModules,
        config: clinics.config,
      })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const clinicConfig = {
      facilityType: clinic[0].facilityType,
      edition: clinic[0].edition,
      enabledModules: clinic[0].enabledModules as string[],
      config: clinic[0].config as Record<string, any>,
    };

    return NextResponse.json({
      data: clinicConfig,
      message: 'Clinic config refreshed successfully',
    });
  } catch (error) {
    console.error('Error refreshing clinic config:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to refresh clinic config',
        code: 'REFRESH_ERROR',
      },
      { status: 500 }
    );
  }
}
