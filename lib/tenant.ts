import { db } from '@/db';
import { clinics, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from './permissions';

export interface TenantContext {
  userId: string;
  userRole: string;
  clinicId?: string;
  email: string;
}

export interface AccessCheckResult {
  success: boolean;
  response?: NextResponse;
  context?: TenantContext;
}

export interface TenantContext {
  userId: string;
  userRole: string;
  clinicId?: string;
  email: string;
}

/**
 * Validates that the requesting user has access to the specified clinic AND has the required permission.
 * 
 * This combines tenant scope validation with permission checking.
 * 
 * Roles:
 * - super_admin: Access to all clinics + all permissions
 * - clinic_admin: Access only to their assigned clinic + admin permissions
 * - doctor: Access only to their assigned clinic + doctor permissions
 * - receptionist: Access only to their assigned clinic + receptionist permissions
 */
export async function validateTenantScope(
  request: NextRequest,
  targetClinicId: string,
  resource: string,
  method: string
): Promise<AccessCheckResult> {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  // 401 - Not authenticated (missing user context)
  if (!userId || !userRole) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    };
  }

  // Fetch full user details from database
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required: User not found', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    };
  }

  const userData = user[0];

  // Check permission first
  const userPermissions = (userData.permissions as Record<string, string[]>) || null;
  const permissionCheck = checkPermission(request, resource, method, userData.id, userData.role, userPermissions);
  if (!permissionCheck.success) {
    return {
      success: false,
      response: permissionCheck.response,
    };
  }

  // Super admin can access any clinic
  if (userData.role === 'super_admin') {
    // Verify clinic exists
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, targetClinicId))
      .limit(1);

    if (clinic.length === 0) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Clinic not found', code: 'NOT_FOUND' },
          { status: 404 }
        ),
      };
    }

    return {
      success: true,
      context: {
        userId: userData.id,
        userRole: userData.role,
        email: userData.email,
      },
    };
  }

  // 403 - Tenant scope violation (wrong clinic)
  if (userData.clinicId !== targetClinicId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Permission denied: Cannot access data from another clinic', code: 'PERMISSION_DENIED' },
        { status: 403 }
      ),
    };
  }

  // Verify clinic exists and is active
  const clinic = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, targetClinicId))
    .limit(1);

  if (clinic.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    };
  }

  if (!clinic[0].isActive) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Clinic is suspended', code: 'CLINIC_SUSPENDED' },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    context: {
      userId: userData.id,
      userRole: userData.role,
      clinicId: userData.clinicId,
      email: userData.email,
    },
  };
}

/**
 * Helper to extract user context from request headers
 */
export function getUserContext(request: NextRequest): TenantContext | null {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const clinicId = request.headers.get('x-clinic-id');

  if (!userId || !userRole) {
    return null;
  }

  return {
    userId,
    userRole,
    clinicId: clinicId || undefined,
    email: '', // Not stored in headers, fetch from DB if needed
  };
}
