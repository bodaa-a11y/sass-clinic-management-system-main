import { NextRequest, NextResponse } from 'next/server'
import { validateTenantScope } from '@/lib/tenant'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheckResult = await validateTenantScope(request, params.id, 'roles', 'GET')
    if (!tenantCheckResult.success) {
      return tenantCheckResult.response
    }

    const { clinicId } = tenantCheckResult.context!

    if (!clinicId) {
      return NextResponse.json(
        { error: 'Clinic ID is required' },
        { status: 400 }
      )
    }

    // Get all users and their permissions
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.clinicId, clinicId as string))

    // Group permissions by role
    const rolePermissionsMap: Record<string, any> = {}

    allUsers.forEach((user) => {
      if (!rolePermissionsMap[user.role]) {
        rolePermissionsMap[user.role] = user.permissions || {}
      }
    })

    // Convert to array format
    const rolePermissions = Object.entries(rolePermissionsMap).map(([role, permissions]) => ({
      role,
      displayName: getRoleDisplayName(role),
      permissions: normalizePermissions(permissions),
    }))

    // Add default roles if they don't exist
    const defaultRoles = ['doctor', 'receptionist', 'nurse', 'clinic_admin']
    defaultRoles.forEach((role) => {
      if (!rolePermissionsMap[role]) {
        rolePermissions.push({
          role,
          displayName: getRoleDisplayName(role),
          permissions: getDefaultPermissionsForRole(role),
        })
      }
    })

    return NextResponse.json({ data: rolePermissions })
  } catch (error) {
    console.error('Error fetching role permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role permissions' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheckResult = await validateTenantScope(request, params.id, 'roles', 'PUT')
    if (!tenantCheckResult.success) {
      return tenantCheckResult.response
    }

    const { clinicId } = tenantCheckResult.context!
    const { rolePermissions } = await request.json()

    // Update permissions for each role
    for (const rolePerm of rolePermissions) {
      const { role, permissions } = rolePerm

      // Update all users with this role
      await db
        .update(users)
        .set({ permissions })
        .where(and(eq(users.clinicId, clinicId as string), eq(users.role, role)))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating role permissions:', error)
    return NextResponse.json(
      { error: 'Failed to update role permissions' },
      { status: 500 }
    )
  }
}

function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    doctor: 'الطبيب',
    receptionist: 'موظف الاستقبال',
    nurse: 'الممرض',
    clinic_admin: 'مدير العيادة',
    super_admin: 'السوبر أدمن',
  }
  return displayNames[role] || role
}

function normalizePermissions(permissions: any): any {
  const normalized: any = {}
  const modules = [
    'patients',
    'appointments',
    'medical_records',
    'prescriptions',
    'invoices',
    'payments',
    'specialties',
    'calendar',
    'schedule',
    'live-monitor',
    'staff_management',
    'staff_management_limited',
    'reports',
    'dashboard',
    'vitals',
  ]

  modules.forEach((module) => {
    const modulePerms = permissions[module] || []
    normalized[module] = {
      view: modulePerms.includes('view'),
      create: modulePerms.includes('create'),
      edit: modulePerms.includes('edit'),
      delete: modulePerms.includes('delete'),
    }
  })

  return normalized
}

function getDefaultPermissionsForRole(role: string): any {
  const { getDefaultModulePermissions } = require('@/lib/permissions')
  return normalizePermissions(getDefaultModulePermissions(role))
}
