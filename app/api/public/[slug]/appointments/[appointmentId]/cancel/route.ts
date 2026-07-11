import { db } from '@/db';
import { appointments, clinics } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    // Get clinic by slug
    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, slug))
      .limit(1);

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const clinicId = clinic[0].id;

    // Find the appointment
    const appointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.clinicId, clinicId)
        )
      )
      .limit(1);

    if (appointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found', code: 'APPOINTMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentStatus = appointment[0].status;

    // Check if appointment can be cancelled
    if (currentStatus === 'cancelled') {
      return NextResponse.json(
        { error: 'الموعد ملغى مسبقاً', code: 'ALREADY_CANCELLED' },
        { status: 400 }
      );
    }

    if (currentStatus === 'done') {
      return NextResponse.json(
        { error: 'لا يمكن إلغاء موعد منتهٍ', code: 'APPOINTMENT_DONE' },
        { status: 400 }
      );
    }

    // Only allow cancelling pending or confirmed appointments
    if (currentStatus !== 'pending' && currentStatus !== 'confirmed') {
      return NextResponse.json(
        { error: 'لا يمكن إلغاء هذا الموعد', code: 'CANNOT_CANCEL' },
        { status: 400 }
      );
    }

    // Update appointment status to cancelled
    await db
      .update(appointments)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.clinicId, clinicId)
        )
      );

    return NextResponse.json({
      message: 'تم إلغاء الموعد بنجاح',
      data: {
        appointmentId,
        status: 'cancelled'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel appointment', code: 'CANCEL_ERROR' },
      { status: 500 }
    );
  }
}
