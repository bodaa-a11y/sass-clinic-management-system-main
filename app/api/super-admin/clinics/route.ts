import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { clinics, users, appointments, patients, invoices } from '@/db/schema'
import { eq, desc, and, isNotNull, sql } from 'drizzle-orm'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/super-admin/clinics
 * List all clinics with statistics (Super Admin only)
 */
export async function GET(request: NextRequest) {
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

    // Get all clinics with their statistics
    const allClinics = await db
      .select()
      .from(clinics)
      .orderBy(desc(clinics.createdAt))

    // Get statistics for each clinic
    const clinicsWithStats = await Promise.all(
      allClinics.map(async (clinic) => {
        // Get patient count
        const patientCount = await db
          .select({ count: sql<number>`count(*)`.as('count') })
          .from(patients)
          .where(eq(patients.clinicId, clinic.id))

        // Get appointment count
        const appointmentCount = await db
          .select({ count: sql<number>`count(*)`.as('count') })
          .from(appointments)
          .where(eq(appointments.clinicId, clinic.id))

        // Get doctor count
        const doctorCount = await db
          .select({ count: sql<number>`count(*)`.as('count') })
          .from(users)
          .where(
            and(
              eq(users.clinicId, clinic.id),
              eq(users.role, 'doctor')
            )
          )

        // Get total revenue from invoices
        const invoicesData = await db
          .select({ totalAmount: invoices.totalAmount })
          .from(invoices)
          .where(
            and(
              eq(invoices.clinicId, clinic.id),
              eq(invoices.status, 'paid')
            )
          )

        const revenue = invoicesData.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0)

        return {
          ...clinic,
          stats: {
            patientCount: patientCount[0]?.count || 0,
            appointmentCount: appointmentCount[0]?.count || 0,
            doctorCount: doctorCount[0]?.count || 0,
            revenue,
          },
        }
      })
    )

    return NextResponse.json({ data: clinicsWithStats })
  } catch (error) {
    console.error('Error fetching clinics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clinics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/super-admin/clinics
 * Create a new clinic (Super Admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, slug, facilityType, edition } = body

    // Validate required fields
    if (!name || !slug || !facilityType || !edition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug is already taken
    const existingClinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, slug))
      .limit(1)

    if (existingClinic.length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      )
    }

    // Create clinic
    const newClinic = await db
      .insert(clinics)
      .values({
        name,
        slug,
        facilityType,
        edition,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ data: newClinic[0] })
  } catch (error) {
    console.error('Error creating clinic:', error)
    return NextResponse.json(
      { error: 'Failed to create clinic' },
      { status: 500 }
    )
  }
}
