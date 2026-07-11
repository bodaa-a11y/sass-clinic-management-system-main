import { db } from '@/db'
import { clinics, departments } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; departmentId: string }> }
) {
  try {
    const { id: clinicId, departmentId } = await params

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // Check clinic exists and module is enabled
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1)

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const enabledModules = clinic[0].enabledModules as string[] || []
    if (!enabledModules.includes('departments')) {
      return NextResponse.json(
        { error: 'Departments module is not enabled', code: 'MODULE_NOT_ENABLED' },
        { status: 403 }
      )
    }

    // Check permissions
    if (decoded.role !== 'clinic_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only clinic admins can update departments', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Update department
    const [updatedDepartment] = await db
      .update(departments)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.clinicId, clinicId),
          isNull(departments.deletedAt)
        )
      )
      .returning()

    if (!updatedDepartment) {
      return NextResponse.json(
        { error: 'Department not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updatedDepartment })
  } catch (error) {
    console.error('[Departments API] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update department', code: 'UPDATE_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; departmentId: string }> }
) {
  try {
    const { id: clinicId, departmentId } = await params

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // Check clinic exists and module is enabled
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1)

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const enabledModules = clinic[0].enabledModules as string[] || []
    if (!enabledModules.includes('departments')) {
      return NextResponse.json(
        { error: 'Departments module is not enabled', code: 'MODULE_NOT_ENABLED' },
        { status: 403 }
      )
    }

    // Check permissions
    if (decoded.role !== 'clinic_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only clinic admins can delete departments', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Soft delete department
    const [deletedDepartment] = await db
      .update(departments)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.clinicId, clinicId),
          isNull(departments.deletedAt)
        )
      )
      .returning()

    if (!deletedDepartment) {
      return NextResponse.json(
        { error: 'Department not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: deletedDepartment })
  } catch (error) {
    console.error('[Departments API] DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete department', code: 'DELETE_ERROR' },
      { status: 500 }
    )
  }
}
