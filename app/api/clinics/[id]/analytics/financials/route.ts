import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { appointments, invoices, users } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const doctorId = searchParams.get('doctorId') || 'all'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
    }

    // Build query conditions
    const conditions = [
      eq(appointments.clinicId, id),
      gte(appointments.appointmentDate, startDate.toISOString().split('T')[0]),
      lte(appointments.appointmentDate, now.toISOString().split('T')[0]),
    ]

    if (doctorId !== 'all') {
      conditions.push(eq(appointments.doctorId, doctorId))
    }

    // Get completed appointments
    const completedAppointments = await db
      .select()
      .from(appointments)
      .where(and(...conditions, eq(appointments.status, 'done')))

    // Get invoices
    const invoiceConditions = [
      eq(invoices.clinicId, id),
      gte(invoices.createdAt, startDate),
      lte(invoices.createdAt, now),
    ]

    if (doctorId !== 'all') {
      // Need to join with appointments to filter by doctor
      // For simplicity, we'll skip this for now
    }

    const clinicInvoices = await db
      .select()
      .from(invoices)
      .where(and(...invoiceConditions))

    // Calculate totals
    const totalRevenue = clinicInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount || '0'),
      0
    )

    const totalAppointments = completedAppointments.length
    const avgRevenuePerPatient = totalAppointments > 0 ? totalRevenue / totalAppointments : 0

    // Get revenue by doctor
    const revenueByDoctor = await db
      .select({
        doctorId: appointments.doctorId,
        doctorName: users.fullName,
        revenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
      })
      .from(appointments)
      .leftJoin(invoices, eq(invoices.appointmentId, appointments.id))
      .leftJoin(users, eq(users.id, appointments.doctorId))
      .where(and(...conditions, eq(appointments.status, 'done')))
      .groupBy(appointments.doctorId, users.fullName)

    return NextResponse.json({
      data: {
        totalRevenue,
        totalAppointments,
        avgRevenuePerPatient,
        revenueByDoctor: revenueByDoctor.map((item) => ({
          doctorName: item.doctorName || 'Unknown',
          revenue: parseFloat(item.revenue?.toString() || '0'),
        })),
      },
    })
  } catch (error) {
    console.error('[Financial Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial analytics' },
      { status: 500 }
    )
  }
}
