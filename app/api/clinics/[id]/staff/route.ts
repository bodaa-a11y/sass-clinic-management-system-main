/**
 * Staff Management API with Quick-Login System
 *
 * Note: Using users table directly (staff table is deprecated)
 *
 * RBAC Permissions:
 * - clinic_admin: staff:create, staff:read, staff:update, staff:delete
 * - doctor: staff:read only (except in single_clinic where can create receptionist)
 * - receptionist: no staff access
 *
 * Quick-Login Flow:
 * 1. Admin creates user with temporary password
 * 2. Account is immediately active (status=active)
 * 3. Staff can login immediately with provided credentials
 */

import { db } from '@/db';
import { clinics, users, specialties } from '@/db/schema';
import { validateTenantScope, getUserContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { hashPassword } from '@/lib/auth';
import { initializeUserPermissions, normalizePermissions } from '@/lib/permissions';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const permissionsSchema = z.record(z.string(), z.array(z.enum(['view', 'create', 'edit', 'delete']))).optional();

// Validation schemas
const createStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: z.enum(['doctor', 'receptionist', 'nurse']),
  name: z.string().min(2, 'Name is required'),
  specialtyId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid().optional()
  ),
  permissions: permissionsSchema,
});

const updateStaffSchema = z.object({
  role: z.enum(['doctor', 'receptionist', 'nurse']).optional(),
  isActive: z.boolean().optional(),
  permissions: permissionsSchema,
});

/**
 * GET /api/clinics/[id]/staff
 * List all staff members (users) for the clinic
 *
 * Permission Logic:
 * - Allow any authenticated user in the same clinic to view staff list
 * - This is needed for dropdowns in appointment booking and staff management
 * - POST/PATCH/DELETE require staff-management permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Allow any authenticated user in the same clinic to view staff list
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

    // Get role filter from query params
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    // Build where conditions
    const whereConditions: any[] = [
      eq(users.clinicId, id),
      eq(users.isActive, true)
    ];

    // Add role filter if provided
    if (roleFilter === 'doctor' || roleFilter === 'receptionist' || roleFilter === 'nurse') {
      whereConditions.push(eq(users.role, roleFilter as any));
    }

    // Get all users for this clinic with specialty info (excluding super_admin)
    const staffMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        isActive: users.isActive,
        specialtyId: users.specialtyId,
        specialtyName: specialties.name,
        permissions: users.permissions,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(specialties, eq(users.specialtyId, specialties.id))
      .where(and(...whereConditions))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({
      data: staffMembers,
      count: staffMembers.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch staff',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clinics/[id]/staff
 * Create new staff member with invite token
 * Permission: staff:create (clinic_admin only)
 * Special case: single_clinic users (doctor/clinic_admin) can create receptionist only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context to check role and clinic type
    const userContext = await getUserContext(request);
    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get clinic info to check facility type
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        {
          error: 'Clinic not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const facilityType = clinic[0].facilityType;

    // Special case: single_clinic users can create receptionist only
    const isSingleClinicLimited = (userContext.userRole === 'doctor' || userContext.userRole === 'clinic_admin') && facilityType === 'single_clinic';

    // Permission check
    if (isSingleClinicLimited) {
      // Allow single clinic users to create receptionist
      // Will validate role in body
    } else {
      // Standard permission check for clinic_admin
      const tenantCheck = await validateTenantScope(request, id, 'staff', 'POST');
      if (!tenantCheck.success) {
        return tenantCheck.response!;
      }
    }

    const context = userContext;
    const ip = getClientIP(request);

    // Validate request body
    const body = await request.json();
    const validatedData = createStaffSchema.parse(body);

    // For single clinic limited mode, only allow receptionist role
    if (isSingleClinicLimited && validatedData.role !== 'receptionist') {
      return NextResponse.json(
        {
          error: 'Single clinic users can only add receptionist staff',
          code: 'INVALID_ROLE',
        },
        { status: 403 }
      );
    }

    // Check staff limits based on facility type and role
    const currentStaff = await db
      .select()
      .from(users)
      .where(eq(users.clinicId, id));

    const doctorCount = currentStaff.filter(s => s.role === 'doctor').length;
    const receptionistCount = currentStaff.filter(s => s.role === 'receptionist').length;
    const nurseCount = currentStaff.filter(s => s.role === 'nurse' as any).length;

    const receptionistLimit = facilityType === 'single_clinic' ? 2 : 30;

    // Check doctor limit for single clinic
    if (validatedData.role === 'doctor' && facilityType === 'single_clinic' && doctorCount >= 1) {
      return NextResponse.json(
        {
          error: 'Single clinic can only have one doctor',
          code: 'DOCTOR_LIMIT_EXCEEDED',
        },
        { status: 403 }
      );
    }

    // Check receptionist limit
    if (validatedData.role === 'receptionist' && receptionistCount >= receptionistLimit) {
      return NextResponse.json(
        {
          error: `Cannot add more than ${receptionistLimit} receptionists`,
          code: 'RECEPTIONIST_LIMIT_EXCEEDED',
        },
        { status: 403 }
      );
    }

    // Check nurse availability (only in medical center)
    if (validatedData.role === 'nurse' && facilityType !== 'medical_center') {
      return NextResponse.json(
        {
          error: 'Nurses are only available in medical centers',
          code: 'NURSE_NOT_AVAILABLE',
        },
        { status: 403 }
      );
    }

    // Check if email already exists (only active users)
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, validatedData.email),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: 'Email already registered',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    // Hash password (required for quick-login system)
    const passwordHash = await hashPassword(validatedData.password);

    // CRITICAL SECURITY: Always use clinicId from params, never from body
    // This prevents tenant isolation bypass attacks
    const finalClinicId = id;

    // Create user record (staff table is deprecated, using users table)
    // For single clinic limited mode, use special permissions
    let permissions;
    if (isSingleClinicLimited) {
      // Use standard receptionist permissions
      permissions = initializeUserPermissions('receptionist');
    } else {
      // Initialize permissions: use provided permissions or defaults based on role
      permissions = validatedData.permissions && Object.keys(validatedData.permissions).length > 0
        ? normalizePermissions(validatedData.permissions)
        : initializeUserPermissions(validatedData.role);
    }

    const userData: any = {
      clinicId: finalClinicId,
      email: validatedData.email,
      name: validatedData.name,
      passwordHash: passwordHash,
      role: validatedData.role,
      permissions: permissions,
      status: 'active', // Immediately active with provided password
      isActive: true,
      deletedAt: null,
    };

    // Only include specialtyId if it's a valid UUID
    if (validatedData.specialtyId && validatedData.specialtyId !== '') {
      userData.specialtyId = validatedData.specialtyId;
    }

    const newUser = await db
      .insert(users)
      .values(userData)
      .returning();

    // Audit logging
    await logAudit({
      action: 'CREATE_STAFF',
      entityType: 'user',
      entityId: newUser[0].id,
      clinicId: finalClinicId,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: {
        email: newUser[0].email,
        role: newUser[0].role,
        status: newUser[0].status,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: newUser[0].id,
          email: newUser[0].email,
          role: newUser[0].role,
          status: newUser[0].status,
          name: validatedData.name,
        },
        message: 'تم إنشاء الحساب بنجاح',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create staff member',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}

