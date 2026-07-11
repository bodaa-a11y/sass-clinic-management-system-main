import { db } from '@/db';
import { appointments, availabilitySlots, clinics, doctorLeaves, patients, users } from '@/db/schema';
import {
  buildOccupiedRanges,
  checkConflict,
  structuredLog,
  suggestAlternativeSlots,
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
import { sendBookingConfirmation } from '@/lib/email';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { and, eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bookingSchema = z.object({
  doctor_id: z.string().uuid(),
  patient_name: z.string().min(2),
  patient_phone: z.string().min(5),
  patient_email: z.string().email().optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
  priority: z.enum(['normal', 'priority', 'emergency']).default('normal'),
  // Recurring appointment fields
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringCount: z.number().int().min(1).max(52).optional(),
});

// Rate limiting for public booking (10 attempts per hour per IP)
const BOOKING_MAX_ATTEMPTS = 10;
const BOOKING_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Rate limiting by IP
    const ip = getClientIP(request);
    const rateLimitKey = `booking:${ip}:${slug}`;
    const rateLimitResult = rateLimit(rateLimitKey, BOOKING_MAX_ATTEMPTS, BOOKING_WINDOW_MS);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many booking attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // 1. Resolve clinic
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
    const body = await request.json();
    console.log('[book/route] Request body:', body);

    const validatedData = bookingSchema.parse(body);
    const priority = validatedData.priority as AppointmentPriority;

    // 2. Verify doctor exists and is active
    const doctor = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, validatedData.doctor_id),
          eq(users.clinicId, clinicId),
          eq(users.role, 'doctor'),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        { error: 'Doctor not found or inactive', code: 'DOCTOR_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Check doctor leave
    const leaveCheck = await db
      .select()
      .from(doctorLeaves)
      .where(
        and(
          eq(doctorLeaves.clinicId, clinicId),
          eq(doctorLeaves.doctorId, validatedData.doctor_id),
          eq(doctorLeaves.leaveDate, validatedData.date)
        )
      )
      .limit(1);

    if (leaveCheck.length > 0) {
      return NextResponse.json(
        { error: 'الدكتور في إجازة هذا اليوم', code: 'DOCTOR_ON_LEAVE' },
        { status: 409 }
      );
    }

    // 4. Load availability config for buffer + duration
    const dateObj = new Date(validatedData.date);
    const dayOfWeek = dateObj.getDay();

    const availabilityConfig = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.clinicId, clinicId),
          eq(availabilitySlots.doctorId, validatedData.doctor_id),
          eq(availabilitySlots.dayOfWeek, dayOfWeek)
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
      bufferAfterMinutes: config.bufferAfterMinutes,
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
          validatedData.date,
          validatedData.recurringPattern!,
          validatedData.recurringCount!
        )
      : [{ date: validatedData.date, index: 0 }];

    // Calculate recurring end date
    const recurringEndDate = validatedData.isRecurring
      ? calculateRecurringEndDate(
          validatedData.date,
          validatedData.recurringPattern!,
          validatedData.recurringCount!
        )
      : null;

    // ─── CRITICAL SECTION: Transaction ────────────────────────────────────────
    // The SELECT of existing appointments + INSERT of new appointment happen
    // within a single serializable transaction. Even if two requests arrive
    // simultaneously, the unique index on (doctor_id, appointment_date,
    // start_time) WHERE status IN ('pending','confirmed') ensures DB-level
    // rejection of the second inserter — no race condition can create a double
    // booking.
    const newAppointment = await db.transaction(async (tx) => {
      // Check conflicts for all recurring dates
      for (const { date, index } of recurringDates) {
        const bookedAppointments = await tx
          .select({ startTime: appointments.startTime })
          .from(appointments)
          .where(
            and(
              eq(appointments.clinicId, clinicId),
              eq(appointments.doctorId, validatedData.doctor_id),
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

        // Build sorted occupied ranges O(n log n)
        const occupied = buildOccupiedRanges(
          booked,
          config.slotDurationMinutes,
          config.bufferAfterMinutes
        );

        const proposal: BookingProposal = {
          requestedTime: validatedData.start_time,
          priority,
          doctorId: validatedData.doctor_id,
          date: date,
        };

        // Smart conflict check using binary search O(log n)
        const conflict = checkConflict(proposal, occupied, config.slotDurationMinutes);

        if (conflict.hasConflict) {
          // Find alternative slots to suggest
          const suggestions = suggestAlternativeSlots(proposal, engineConfig, occupied, 4);

          structuredLog('BOOKING_CONFLICT', {
            doctorId: validatedData.doctor_id,
            date,
            requestedTime: validatedData.start_time,
            priority,
            reason: conflict.reason,
            conflictsWith: conflict.conflictingRange
              ? `${conflict.conflictingRange.from}-${conflict.conflictingRange.to} min`
              : 'unknown',
            suggestedSlots: suggestions,
          });

          // Throw a typed error so we can catch it outside the transaction
          throw Object.assign(new Error('TIME_SLOT_CONFLICT'), {
            code: 'TIME_SLOT_TAKEN',
            suggestions,
            reason: conflict.reason,
            conflictDate: date,
          });
        }
      }

      // Find or create patient
      let patient = await tx
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.clinicId, clinicId),
            eq(patients.phone, validatedData.patient_phone)
          )
        )
        .limit(1);

      let patientId: string;

      if (patient.length === 0) {
        const inserted = await tx
          .insert(patients)
          .values({
            clinicId,
            fullName: validatedData.patient_name,
            phone: validatedData.patient_phone,
            email: validatedData.patient_email || undefined,
          })
          .returning();
        patientId = inserted[0].id;
      } else {
        patientId = patient[0].id;
        if (validatedData.patient_email && !patient[0].email) {
          await tx
            .update(patients)
            .set({ email: validatedData.patient_email })
            .where(eq(patients.id, patientId));
        }
      }

      // Insert parent appointment (first date)
      const parentInserted = await tx
        .insert(appointments)
        .values({
          clinicId,
          patientId,
          doctorId: validatedData.doctor_id,
          appointmentDate: recurringDates[0].date,
          startTime: validatedData.start_time,
          endTime: validatedData.start_time, // Will be calculated properly
          status: 'pending', // Pending approval from reception
          priority,
          notes: validatedData.notes,
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
              clinicId,
              patientId,
              doctorId: validatedData.doctor_id,
              appointmentDate: recurringDates[i].date,
              startTime: validatedData.start_time,
              endTime: validatedData.start_time,
              status: 'pending',
              priority,
              notes: validatedData.notes,
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
    // ──────────────────────────────────────────────────────────────────────────

    structuredLog('BOOKING_SUCCESS', {
      appointmentId: newAppointment.id,
      priority,
      doctorId: validatedData.doctor_id,
      date: validatedData.date,
      time: validatedData.start_time,
    });

    // Send email (outside transaction — non-critical)
    const patientRecord = await db
      .select({ email: patients.email, fullName: patients.fullName })
      .from(patients)
      .where(eq(patients.id, newAppointment.patientId))
      .limit(1);

    const patientEmail = validatedData.patient_email || patientRecord[0]?.email;
    if (patientEmail) {
      sendBookingConfirmation({
        patientEmail,
        patientName: validatedData.patient_name,
        clinicName: clinic[0].name,
        doctorName: doctor[0].name || 'الدكتور',
        date: validatedData.date,
        time: validatedData.start_time,
        appointmentId: newAppointment.id,
        slug,
      }).catch((e) => console.error('Email send failed (non-critical):', e));
    }

    return NextResponse.json(
      {
        data: {
          appointment_id: newAppointment.id,
          clinic_name: clinic[0].name,
          doctor_name: doctor[0].name,
          patient_name: validatedData.patient_name,
          date: validatedData.date,
          start_time: validatedData.start_time,
          priority,
          status: 'pending',
        },
        message: 'Appointment booked successfully',
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
      console.error('[book/route] Zod validation error:', error.issues);
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    console.error('[book/route] Unexpected error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to book appointment',
        code: 'BOOKING_ERROR',
      },
      { status: 500 }
    );
  }
}
