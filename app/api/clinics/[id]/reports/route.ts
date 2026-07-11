import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { and, count, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clinicId = id;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Helper to get month start/end
    const getMonthRange = (year: number, month: number) => {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 1).toISOString().split('T')[0];
      return { start, end };
    };

    // 1. Monthly appointments for last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const { start, end } = getMonthRange(year, month);
      const monthName = date.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' });

      const result = await db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, clinicId),
            gte(appointments.appointmentDate, start),
            lt(appointments.appointmentDate, end)
          )
        );

      monthlyData.push({
        month: monthName,
        count: result[0].count,
      });
    }

    // 2. Status distribution
    const statusCounts = await db
      .select({
        status: appointments.status,
        count: count(),
      })
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId))
      .groupBy(appointments.status);

    const statusDistribution = {
      pending: 0,
      confirmed: 0,
      done: 0,
      cancelled: 0,
    };
    statusCounts.forEach((s) => {
      if (s.status in statusDistribution) {
        statusDistribution[s.status as keyof typeof statusDistribution] = s.count;
      }
    });

    // 3. Top 5 patients by visit count
    const { start: thisMonthStart, end: thisMonthEnd } = getMonthRange(currentYear, currentMonth);
    const { start: lastMonthStart, end: lastMonthEnd } = getMonthRange(currentYear, currentMonth - 1);

    const topPatients = await db
      .select({
        patientId: appointments.patientId,
        fullName: patients.fullName,
        visitCount: count(),
        lastVisit: sql<string>`MAX(${appointments.appointmentDate})`,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.clinicId, clinicId))
      .groupBy(appointments.patientId, patients.fullName)
      .orderBy(desc(count()))
      .limit(5);

    // 4. New patients this month vs last month
    const newPatientsThisMonth = await db
      .select({ count: count() })
      .from(patients)
      .where(
        and(
          eq(patients.clinicId, clinicId),
          gte(sql<string>`DATE(${patients.createdAt})`, thisMonthStart),
          lt(sql<string>`DATE(${patients.createdAt})`, thisMonthEnd)
        )
      );

    const newPatientsLastMonth = await db
      .select({ count: count() })
      .from(patients)
      .where(
        and(
          eq(patients.clinicId, clinicId),
          gte(sql<string>`DATE(${patients.createdAt})`, lastMonthStart),
          lt(sql<string>`DATE(${patients.createdAt})`, lastMonthEnd)
        )
      );

    // 5. This month's total appointments
    const thisMonthAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.appointmentDate, thisMonthStart),
          lt(appointments.appointmentDate, thisMonthEnd)
        )
      );

    // 6. Done appointments this month
    const doneAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, 'done'),
          gte(appointments.appointmentDate, thisMonthStart),
          lt(appointments.appointmentDate, thisMonthEnd)
        )
      );

    // 7. Daily average (appointments this month / days passed)
    const daysPassed = now.getDate();
    const dailyAverage = Math.round((thisMonthAppointments[0].count / daysPassed) * 10) / 10;

    return NextResponse.json({
      data: {
        monthlyAppointments: monthlyData,
        statusDistribution,
        topPatients: topPatients.map((p) => ({
          id: p.patientId,
          name: p.fullName,
          visitCount: p.visitCount,
          lastVisit: p.lastVisit,
        })),
        newPatients: {
          thisMonth: newPatientsThisMonth[0].count,
          lastMonth: newPatientsLastMonth[0].count,
        },
        thisMonthStats: {
          totalAppointments: thisMonthAppointments[0].count,
          doneAppointments: doneAppointments[0].count,
          completionRate: thisMonthAppointments[0].count > 0
            ? Math.round((doneAppointments[0].count / thisMonthAppointments[0].count) * 100)
            : 0,
          dailyAverage,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch reports',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
