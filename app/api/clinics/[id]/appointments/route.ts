import { z } from 'zod';
import { db } from '@/db';
import { appointments, availabilitySlots, clinics, patients, users } from '@/db/schema';
import { appointmentSchema } from '@/lib/validations';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import {
  buildOccupiedRanges,
  checkConflict,
  suggestAlternativeSlots,
  structuredLog,
  type AppointmentPriority,
  type AvailabilityConfig,
  type BookedAppointment,
  type BookingProposal,
} from '@/lib/booking-engine';
import {
  calculateRecurringDates,
  calculateRecurringEndDate,
  validateRecurringParams,
} from '@/lib/recurring-utils';
import { and, eq, or, isNull, ne } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to calculate end time from start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

const GETHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // Extract user context from headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date');
    const statusFilter = searchParams.get('status');

    // Build WHERE conditions
    const conditions = [
      eq(appointments.clinicId, id),
      isNull(appointments.deletedAt)
    ];

    // Role-based filtering:
    // - clinic_admin: can see all appointments
    // - doctor: can see their own appointments EXCEPT waiting list (all doctors can see)
    if (userRole === 'doctor' && userId) {
      if (statusFilter === 'in-waiting-room') {
        // All doctors can see patients in waiting room (multi-doctor clinics)
      } else {
        // For other statuses, doctors see only their own appointments
        conditions.push(eq(appointments.doctorId, userId));
      }
    }
    // clinic_admin can see all appointments (no filtering needed)

    if (dateFilter) {
      conditions.push(eq(appointments.appointmentDate, dateFilter));
    }
    if (statusFilter) {
      conditions.push(eq(appointments.status, statusFilter as 'pending' | 'confirmed' | 'cancelled' | 'done' | 'in-progress' | 'in-waiting-room' | 'no-show'));
    }

    // Query with JOINs to get patient and doctor names
    const allAppointments = await db
      .select({
        id: appointments.id,
        clinicId: appointments.clinicId,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        status: appointments.status,
        priority: appointments.priority,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patientName: patients.fullName,
        patientPhone: patients.phone,
        doctorName: users.name,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .where(and(...conditions));

    return NextResponse.json({
      data: allAppointments,
      count: allAppointments.length,
    });
  } catch (error) {
    console.error('Appointments GET error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

export const GET = GETHandler;

const POSTHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    console.log('POST appointments - clinicId:', id);

    // Validate tenant scope + permission (appointments:create)
    const tenantCheck = await validateTenantScope(request, id, 'appointments', 'POST');
    console.log('POST appointments - tenantCheck success:', tenantCheck.success);
    if (!tenantCheck.success) {
      console.log('POST appointments - tenantCheck failed:', tenantCheck.response);
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();
    console.log('POST appointments - body:', body);

    // Validate required fields
    if (!body.doctorId || body.doctorId === '') {
      return NextResponse.json(
        { error: 'Doctor ID is required', code: 'MISSING_DOCTOR_ID' },
        { status: 400 }
      );
    }

    // Transform client format to schema format
    const transformedBody = {
      doctorId: body.doctorId,
      patientId: body.patientId,
      appointmentDate: body.date || body.appointmentDate,
      startTime: body.time || body.startTime,
      notes: body.notes,
      priority: body.priority || 'normal',
    };
    console.log('POST appointments - transformed:', transformedBody);

    const validatedData = appointmentSchema.parse(transformedBody);
    console.log('POST appointments - validated:', validatedData);

    const doctor = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, validatedData.doctorId),
          eq(users.clinicId, id),
          eq(users.isActive, true),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        {
          error: 'Doctor not found, inactive, or does not belong to this clinic',
          code: 'DOCTOR_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const patient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, validatedData.patientId),
          eq(patients.clinicId, id),
          isNull(patients.deletedAt)
        )
      )
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json(
        {
          error: 'Patient not found or does not belong to this clinic',
          code: 'PATIENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Fetch doctor's availability configuration to get slot duration and buffer
    const dayOfWeek = new Date(validatedData.appointmentDate).getDay();
    const availabilityConfig = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.clinicId, id),
          eq(availabilitySlots.doctorId, validatedData.doctorId),
          eq(availabilitySlots.dayOfWeek, dayOfWeek),
          eq(availabilitySlots.isActive, true)
        )
      )
      .limit(1);

    if (availabilityConfig.length === 0) {
      return NextResponse.json(
        { error: 'لا يوجد جدول متاح لهذا الدكتور في هذا اليوم', code: 'NO_AVAILABILITY' },
        { status: 409 }
      );
    }

    const config = availabilityConfig[0];
    const engineConfig: AvailabilityConfig = {
      startTime: config.startTime,
      endTime: config.endTime,
      slotDurationMinutes: config.slotDurationMinutes,
      bufferAfterMinutes: config.bufferAfterMinutes || 0,
    };

    // Validate recurring parameters if provided
    if (validatedData.isRecurring) {
      if (!validatedData.recurringPattern || !validatedData.recurringCount) {
        return NextResponse.json(
          {
            error: 'Reurring pattern and count are required for recurring appointments',
            code: 'MISSING_RECURRING_PARAMS',
          },
          { status: 400 }
        );
      }

      const validation = validateRecurringParams(
        validatedData.recurringPattern,
        validatedData.recurringCount
      );

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, code: 'INVALID_RECURRING_PARAMS' },
          { status: 400 }
        );
      }
    }

    // Calculate recurring dates if needed
    const recurringDates = validatedData.isRecurring
      ? calculateRecurringDates(
          validatedData.appointmentDate,
          validatedData.recurringPattern!,
          validatedData.recurringCount!
        )
      : [{ date: validatedData.appointmentDate, index: 0 }];

    // Calculate recurring end date
    const recurringEndDate = validatedData.isRecurring
      ? calculateRecurringEndDate(
          validatedData.appointmentDate,
          validatedData.recurringPattern!,
          validatedData.recurringCount!
        )
      : null;

    // Use transaction to prevent race conditions
    const newAppointment = await db.transaction(async (tx) => {
      // Check conflicts for all recurring dates
      for (const { date, index } of recurringDates) {
        const bookedAppointments = await tx
          .select({ startTime: appointments.startTime })
          .from(appointments)
          .where(
            and(
              eq(appointments.clinicId, id),
              eq(appointments.doctorId, validatedData.doctorId),
              eq(appointments.appointmentDate, date),
              or(
                eq(appointments.status, 'confirmed'),
                eq(appointments.status, 'pending'),
                eq(appointments.status, 'in-waiting-room'),
                eq(appointments.status, 'in-progress')
              )
            )
          );

        const booked: BookedAppointment[] = bookedAppointments.map((a) => ({
          startTime: a.startTime,
        }));

        // Build occupied ranges with buffer time
        const occupied = buildOccupiedRanges(
          booked,
          config.slotDurationMinutes,
          config.bufferAfterMinutes || 0
        );

        const proposal: BookingProposal = {
          requestedTime: validatedData.startTime,
          priority: validatedData.priority as AppointmentPriority,
          doctorId: validatedData.doctorId,
          date: date,
        };

        // Smart conflict check
        const conflict = checkConflict(proposal, occupied, config.slotDurationMinutes);

        if (conflict.hasConflict) {
          const suggestions = suggestAlternativeSlots(proposal, engineConfig, occupied, 4);

          structuredLog('BOOKING_CONFLICT', {
            doctorId: validatedData.doctorId,
            date,
            requestedTime: validatedData.startTime,
            priority: validatedData.priority,
            reason: conflict.reason,
            conflictsWith: conflict.conflictingRange
              ? `${conflict.conflictingRange.from}-${conflict.conflictingRange.to} min`
              : 'unknown',
            suggestedSlots: suggestions,
          });

          throw Object.assign(new Error('TIME_SLOT_CONFLICT'), {
            code: 'TIME_SLOT_TAKEN',
            suggestions,
            reason: conflict.reason,
            conflictDate: date,
          });
        }
      }

      // Calculate end time
      const endTime = calculateEndTime(validatedData.startTime, config.slotDurationMinutes);

      // Insert parent appointment (first date)
      const parentInserted = await tx
        .insert(appointments)
        .values({
          clinicId: id,
          doctorId: validatedData.doctorId,
          patientId: validatedData.patientId,
          appointmentDate: recurringDates[0].date,
          startTime: validatedData.startTime,
          endTime: endTime,
          notes: validatedData.notes,
          status: 'confirmed', // Auto-confirm for better UX
          priority: validatedData.priority || 'normal',
          isRecurring: validatedData.isRecurring,
          recurringPattern: validatedData.recurringPattern,
          recurringCount: validatedData.recurringCount,
          recurringEndDate,
        })
        .returning();

      const parentAppointment = parentInserted[0];

      // Insert child appointments for remaining dates
      if (validatedData.isRecurring && recurringDates.length > 1) {
        for (let i = 1; i < recurringDates.length; i++) {
          await tx
            .insert(appointments)
            .values({
              clinicId: id,
              doctorId: validatedData.doctorId,
              patientId: validatedData.patientId,
              appointmentDate: recurringDates[i].date,
              startTime: validatedData.startTime,
              endTime: endTime,
              notes: validatedData.notes,
              status: 'confirmed',
              priority: validatedData.priority || 'normal',
              isRecurring: true,
              recurringPattern: validatedData.recurringPattern,
              recurringCount: validatedData.recurringCount,
              recurringEndDate,
              parentAppointmentId: parentAppointment.id,
            });
        }
      }

      return parentAppointment;
    });

    // Audit logging
    await logAudit({
      action: 'CREATE_APPOINTMENT',
      entityType: 'appointment',
      entityId: newAppointment.id,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: newAppointment,
    });

    structuredLog('BOOKING_SUCCESS', {
      appointmentId: newAppointment.id,
      priority: newAppointment.priority,
      doctorId: validatedData.doctorId,
      date: validatedData.appointmentDate,
      time: validatedData.startTime,
    });

    return NextResponse.json(
      {
        data: newAppointment,
        message: 'Appointment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle smart conflict with suggestions
    if (error instanceof Error && error.message === 'TIME_SLOT_CONFLICT') {
      const e = error as Error & { code: string; suggestions: string[]; reason: string; conflictDate?: string };
      const message = e.conflictDate
        ? `هذا الوقت غير متاح في ${e.conflictDate}`
        : 'هذا الوقت غير متاح';
      return NextResponse.json(
        {
          error: message,
          code: e.code,
          reason: e.reason,
          suggested_slots: e.suggestions,
          conflict_date: e.conflictDate,
        },
        { status: 409 }
      );
    }

    // Handle DB-level unique constraint violation (race condition safety net)
    if (
      error instanceof Error &&
      error.message.includes('uq_appointment_active')
    ) {
      return NextResponse.json(
        {
          error: 'تم حجز هذا الوقت للتو بواسطة مستخدم آخر',
          code: 'RACE_CONDITION_BLOCKED',
          suggested_slots: [],
        },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create appointment',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}

export const POST = POSTHandler;

const DELETEHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const appointmentId = url.pathname.split('/').pop();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required', code: 'MISSING_APPOINTMENT_ID' },
        { status: 400 }
      );
    }

    // Validate tenant scope + permission (appointments:delete)
    const tenantCheck = await validateTenantScope(request, id, 'appointments', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    // Soft delete the appointment
    const deletedAppointment = await db
      .update(appointments)
      .set({
        deletedAt: new Date(),
      })
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.clinicId, id),
        isNull(appointments.deletedAt)
      ))
      .returning();

    if (deletedAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found or already deleted', code: 'APPOINTMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Audit logging
    await logAudit({
      action: 'CANCEL_APPOINTMENT',
      entityType: 'appointment',
      entityId: appointmentId,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: deletedAppointment[0],
    });

    return NextResponse.json(
      {
        message: 'Appointment deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete appointment',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export const DELETE = DELETEHandler;

const PATCHHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const appointmentId = url.pathname.split('/').pop();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required', code: 'MISSING_APPOINTMENT_ID' },
        { status: 400 }
      );
    }

    // Validate tenant scope + permission (appointments:edit)
    const tenantCheck = await validateTenantScope(request, id, 'appointments', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();

    // Validate body
    if (!body.patientId || !body.doctorId || !body.appointmentDate || !body.startTime) {
      return NextResponse.json(
        { error: 'Patient, doctor, date, and time are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Get current appointment for audit
    const currentAppointment = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.clinicId, id),
        isNull(appointments.deletedAt)
      ))
      .limit(1);

    if (currentAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found', code: 'APPOINTMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch availability config
    const dayOfWeek = new Date(body.appointmentDate).getDay();
    const availabilityConfig = await db
      .select()
      .from(availabilitySlots)
      .where(and(
        eq(availabilitySlots.doctorId, body.doctorId),
        eq(availabilitySlots.clinicId, id),
        eq(availabilitySlots.dayOfWeek, dayOfWeek),
        eq(availabilitySlots.isActive, true)
      ))
      .limit(1);

    if (availabilityConfig.length === 0) {
      return NextResponse.json(
        { error: 'لا يوجد جدول متاح لهذا الدكتور في هذا اليوم', code: 'NO_AVAILABILITY' },
        { status: 409 }
      );
    }

    const config = availabilityConfig[0];
    const engineConfig: AvailabilityConfig = {
      startTime: config.startTime,
      endTime: config.endTime,
      slotDurationMinutes: config.slotDurationMinutes,
      bufferAfterMinutes: config.bufferAfterMinutes || 0,
    };

    // Use transaction to prevent race conditions
    const updatedAppointment = await db.transaction(async (tx) => {
      // Fetch existing appointments excluding the current one
      const bookedAppointments = await tx
        .select({ startTime: appointments.startTime })
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, id),
            eq(appointments.doctorId, body.doctorId),
            eq(appointments.appointmentDate, body.appointmentDate),
            ne(appointments.id, appointmentId),
            or(
              eq(appointments.status, 'confirmed'),
              eq(appointments.status, 'pending'),
              eq(appointments.status, 'in-waiting-room'),
              eq(appointments.status, 'in-progress')
            )
          )
        );

      const booked: BookedAppointment[] = bookedAppointments.map((a) => ({
        startTime: a.startTime,
      }));

      // Build occupied ranges with buffer time
      const occupied = buildOccupiedRanges(
        booked,
        config.slotDurationMinutes,
        config.bufferAfterMinutes || 0
      );

      const proposal: BookingProposal = {
        requestedTime: body.startTime,
        priority: body.priority as AppointmentPriority || 'normal',
        doctorId: body.doctorId,
        date: body.appointmentDate,
      };

      // Smart conflict check
      const conflict = checkConflict(proposal, occupied, config.slotDurationMinutes);

      if (conflict.hasConflict) {
        const suggestions = suggestAlternativeSlots(proposal, engineConfig, occupied, 4);

        throw Object.assign(new Error('TIME_SLOT_CONFLICT'), {
          code: 'TIME_SLOT_TAKEN',
          suggestions,
          reason: conflict.reason,
        });
      }

      const endTime = calculateEndTime(body.startTime, config.slotDurationMinutes);

      // Update appointment
      const updated = await tx
        .update(appointments)
        .set({
          patientId: body.patientId,
          doctorId: body.doctorId,
          appointmentDate: body.appointmentDate,
          startTime: body.startTime,
          endTime: endTime,
          notes: body.notes || null,
          priority: body.priority || 'normal',
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.clinicId, id),
          isNull(appointments.deletedAt)
        ))
        .returning();

      return updated[0];
    });

    // Audit logging
    await logAudit({
      action: 'UPDATE_APPOINTMENT',
      entityType: 'appointment',
      entityId: appointmentId,
      clinicId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: currentAppointment[0],
      newValues: updatedAppointment,
    });

    return NextResponse.json(
      {
        data: updatedAppointment,
        message: 'Appointment updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle smart conflict with suggestions
    if (error instanceof Error && error.message === 'TIME_SLOT_CONFLICT') {
      const e = error as Error & { code: string; suggestions: string[]; reason: string };
      return NextResponse.json(
        {
          error: 'هذا الوقت غير متاح',
          code: e.code,
          reason: e.reason,
          suggested_slots: e.suggestions,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update appointment',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export const PATCH = PATCHHandler;
