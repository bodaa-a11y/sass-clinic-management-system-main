import { db } from '@/db'
import { clinics, departments } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params

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

    // Check clinic exists
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

    // Check if departments module is enabled
    const enabledModules = clinic[0].enabledModules as string[] || []
    if (!enabledModules.includes('departments')) {
      return NextResponse.json(
        { error: 'Departments module is not enabled', code: 'MODULE_NOT_ENABLED' },
        { status: 403 }
      )
    }

    // Fetch departments
    const data = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.clinicId, clinicId),
          isNull(departments.deletedAt)
        )
      )
      .orderBy(departments.createdAt)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[Departments API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch departments', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params

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
        { error: 'Forbidden: Only clinic admins can create departments', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, location, phone, email, headOfDepartment } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Create department
    const [newDepartment] = await db
      .insert(departments)
      .values({
        clinicId,
        name,
        description,
        location,
        phone,
        email,
        headOfDepartment,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ data: newDepartment }, { status: 201 })
  } catch (error) {
    console.error('[Departments API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create department', code: 'CREATE_ERROR' },
      { status: 500 }
    )
  }
}
