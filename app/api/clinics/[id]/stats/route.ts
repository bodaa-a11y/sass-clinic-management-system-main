import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, patients, users, invoices } from '@/db/schema';
import { eq, and, count, gte, lte, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clinicId = params.id;

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get stats
    // Today's appointments
    const todayAppointmentsResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.appointmentDate, startOfDay.toISOString()),
          lte(appointments.appointmentDate, endOfDay.toISOString())
        )
      );

    // Total patients
    const totalPatientsResult = await db
      .select({ count: count() })
      .from(patients)
      .where(eq(patients.clinicId, clinicId));

    // Pending invoices (using 'sent' as it's in the enum)
    const pendingInvoicesResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.clinicId, clinicId),
          sql`${invoices.status} = 'sent'`
        )
      );

    // Waiting patients
    const waitingPatientsResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, 'in-waiting-room')
        )
      );

    // Completed appointments today
    const completedAppointmentsResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, 'done'),
          gte(appointments.appointmentDate, startOfDay.toISOString()),
          lte(appointments.appointmentDate, endOfDay.toISOString())
        )
      );

    // Total staff
    const totalStaffResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.clinicId, clinicId),
          eq(users.isActive, true)
        )
      );

    // Active doctors
    const activeDoctorsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.clinicId, clinicId),
          eq(users.role, 'doctor'),
          eq(users.isActive, true)
        )
      );

    // Active receptionists
    const activeReceptionistsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.clinicId, clinicId),
          eq(users.role, 'receptionist'),
          eq(users.isActive, true)
        )
      );

    const stats = {
      todayAppointments: todayAppointmentsResult[0]?.count || 0,
      totalPatients: totalPatientsResult[0]?.count || 0,
      pendingInvoices: pendingInvoicesResult[0]?.count || 0,
      waitingPatients: waitingPatientsResult[0]?.count || 0,
      completedAppointments: completedAppointmentsResult[0]?.count || 0,
      totalStaff: totalStaffResult[0]?.count || 0,
      activeDoctors: activeDoctorsResult[0]?.count || 0,
      activeReceptionists: activeReceptionistsResult[0]?.count || 0,
    };

    return NextResponse.json({
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching clinic stats:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        code: 'STATS_ERROR',
      },
      { status: 500 }
    );
  }
}
