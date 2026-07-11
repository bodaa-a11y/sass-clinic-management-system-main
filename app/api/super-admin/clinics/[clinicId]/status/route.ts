import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { clinics } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '@/lib/auth'

/**
 * PATCH /api/super-admin/clinics/[clinicId]/status
 * Toggle clinic active status (Super Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    // Read token from httpOnly cookie
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Verify token and check if user is super_admin
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin only', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const { clinicId } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    // Update clinic status
    const updatedClinic = await db
      .update(clinics)
      .set({ isActive })
      .where(eq(clinics.id, clinicId))
      .returning()

    if (updatedClinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updatedClinic[0] })
  } catch (error) {
    console.error('Error updating clinic status:', error)
    return NextResponse.json(
      { error: 'Failed to update clinic status' },
      { status: 500 }
    )
  }
}
