/**
 * Staff Detail API - PATCH / DELETE
 *
 * Note: Using users table directly (staff table is deprecated)
 *
 * PATCH: Update staff member role or status
 * DELETE: Deactivate staff member (soft delete)
 *
 * RBAC: Only clinic_admin can update/delete staff
 */

import { db } from '@/db';
import { users, inviteTokens } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { hashPassword } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const permissionsSchema = z.record(z.string(), z.array(z.enum(['view', 'create', 'edit', 'delete']))).optional();

const updateStaffSchema = z.object({
  name: z.string().min(2, 'Name is required').optional(),
  role: z.enum(['doctor', 'receptionist']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  permissions: permissionsSchema,
});

interface Params {
  params: Promise<{ id: string; staffId: string }>;
}

/**
 * PATCH /api/clinics/[id]/staff/[staffId]
 * Update staff member (role or active status)
 * Permission: staff:update (clinic_admin only)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: clinicId, staffId } = await params;

    // Validate tenant scope + permission (staff:update)
    const tenantCheck = await validateTenantScope(request, clinicId, 'staff', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    // Validate request body
    const body = await request.json();
    const validatedData = updateStaffSchema.parse(body);

    // Get existing staff member
    const existingStaff = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, staffId),
          eq(users.clinicId, clinicId)
        )
      )
      .limit(1);

    if (existingStaff.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Cannot modify super_admin or clinic_admin through this endpoint
    if (existingStaff[0].role === 'super_admin' || existingStaff[0].role === 'clinic_admin') {
      return NextResponse.json(
        { error: 'Cannot modify admin users through this endpoint', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Update user table directly (staff table is deprecated)
    const userUpdateData: any = {};
    if (validatedData.name) userUpdateData.name = validatedData.name;
    if (validatedData.role) userUpdateData.role = validatedData.role;
    if (validatedData.isActive !== undefined) userUpdateData.isActive = validatedData.isActive;
    if (validatedData.permissions) userUpdateData.permissions = validatedData.permissions;

    if (validatedData.password && validatedData.password.length >= 6) {
      userUpdateData.passwordHash = await hashPassword(validatedData.password);
    }

    const updatedUser = await db
      .update(users)
      .set(userUpdateData)
      .where(eq(users.id, staffId))
      .returning();

    // Audit logging
    await logAudit({
      action: 'UPDATE_STAFF',
      entityType: 'user',
      entityId: staffId,
      clinicId: clinicId,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: existingStaff[0],
      newValues: updatedUser[0] || existingStaff[0],
    });

    return NextResponse.json({
      data: updatedUser[0] || existingStaff[0],
      message: 'Staff member updated successfully',
    });
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
        error: error instanceof Error ? error.message : 'Failed to update staff member',
        code: 'UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clinics/[id]/staff/[staffId]
 * Deactivate staff member (soft delete)
 * Permission: staff:delete (clinic_admin only)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: clinicId, staffId } = await params;

    // Validate tenant scope + permission (staff:delete)
    const tenantCheck = await validateTenantScope(request, clinicId, 'staff', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    // Get existing staff member
    const existingStaff = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, staffId),
          eq(users.clinicId, clinicId)
        )
      )
      .limit(1);

    if (existingStaff.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Cannot delete super_admin or clinic_admin through this endpoint
    if (existingStaff[0].role === 'super_admin' || existingStaff[0].role === 'clinic_admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users through this endpoint', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Cannot delete yourself
    if (staffId === context.userId) {
      return NextResponse.json(
        { error: 'Cannot delete yourself', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Soft delete - set isActive to false
    const updatedStaff = await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, staffId))
      .returning();

    // Invalidate any pending invites
    await db
      .update(inviteTokens)
      .set({ isActive: false })
      .where(
        and(
          eq(inviteTokens.userId, staffId),
          eq(inviteTokens.status, 'pending')
        )
      );

    // Audit logging
    await logAudit({
      action: 'DELETE_STAFF',
      entityType: 'user',
      entityId: staffId,
      clinicId: clinicId,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: existingStaff[0],
      newValues: { isActive: false },
    });

    return NextResponse.json({
      message: 'Staff member deactivated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete staff member',
        code: 'DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
