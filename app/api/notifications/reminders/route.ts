import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, patients, users } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface AppointmentWithPatient {
  appointment: typeof appointments.$inferSelect;
  patient: typeof patients.$inferSelect;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, appointmentId, patientId } = body;

    // Get current date and time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const oneHourLater = new Date(now);
    oneHourLater.setHours(oneHourLater.getHours() + 1);

    let appointmentsToSend: AppointmentWithPatient[] = [];

    if (type === 'daily') {
      // Send reminders for appointments tomorrow
      appointmentsToSend = await db
        .select({
          appointment: appointments,
          patient: patients,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            gte(appointments.appointmentDate, tomorrow.toISOString()),
            lte(appointments.appointmentDate, new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString()),
            eq(appointments.status, 'confirmed')
          )
        ) as AppointmentWithPatient[];
    } else if (type === 'hourly') {
      // Send reminders for appointments in the next hour
      appointmentsToSend = await db
        .select({
          appointment: appointments,
          patient: patients,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            gte(appointments.appointmentDate, now.toISOString()),
            lte(appointments.appointmentDate, oneHourLater.toISOString()),
            eq(appointments.status, 'confirmed')
          )
        ) as AppointmentWithPatient[];
    } else if (type === 'waiting') {
      // Send notifications for patients waiting too long
      const waitingThreshold = new Date(now);
      waitingThreshold.setMinutes(waitingThreshold.getMinutes() - 30);

      appointmentsToSend = await db
        .select({
          appointment: appointments,
          patient: patients,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            eq(appointments.status, 'in-waiting-room'),
            lte(appointments.appointmentDate, waitingThreshold.toISOString())
          )
        ) as AppointmentWithPatient[];
    } else if (appointmentId) {
      // Send reminder for specific appointment
      appointmentsToSend = await db
        .select({
          appointment: appointments,
          patient: patients,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(eq(appointments.id, appointmentId)) as AppointmentWithPatient[];
    }

    // In a real implementation, you would send actual emails/SMS here
    // For now, we'll just log the reminders
    const reminders = appointmentsToSend.map(({ appointment, patient }) => ({
      type,
      appointmentId: appointment.id,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      appointmentDate: appointment.appointmentDate,
      message: type === 'waiting'
        ? `المريض ${patient.fullName} ينتظر منذ أكثر من 30 دقيقة`
        : `تذكير بموعدك في ${new Date(appointment.appointmentDate).toLocaleDateString('ar-SA')}`,
    }));

    console.log('Reminders to send:', reminders);

    return NextResponse.json({
      data: {
        sent: reminders.length,
        reminders,
      },
      message: 'Reminders processed successfully',
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send reminders',
        code: 'REMINDER_ERROR',
      },
      { status: 500 }
    );
  }
}
