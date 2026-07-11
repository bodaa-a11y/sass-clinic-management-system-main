/**
 * Auto-Scheduling API
 * POST /api/public/[slug]/auto-schedule
 * 
 * Automatically suggests appointments for patients based on:
 * - Doctor availability
 * - Patient preferences
 * - Priority/urgency
 * - Wait time optimization
 */

import { db } from '@/db';
import { appointments, availabilitySlots, clinics, doctorLeaves, patients, users } from '@/db/schema';
import { 
  findBestAppointments, 
  formatSuggestion, 
  logAutoSchedule,
  type AutoScheduleRequest,
  type DoctorAvailability 
} from '@/lib/auto-scheduling';
import { generateSlots, buildOccupiedRanges } from '@/lib/booking-engine';
import { and, eq, or, gte, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const autoScheduleSchema = z.object({
  patientId: z.string().uuid(),
  priority: z.enum(['normal', 'priority', 'emergency']).default('normal'),
  preferredDoctors: z.array(z.string().uuid()).optional(),
  preferredTimeRange: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  avoidDays: z.array(z.number().min(0).max(6)).optional(),
  maxWaitDays: z.number().min(1).max(30).optional().default(14),
  flexibleWithTime: z.boolean().optional().default(true),
  excludeDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { slug } = await params;

    // 1. Get clinic
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

    // 2. Parse and validate request
    const body = await request.json();
    const validatedData = autoScheduleSchema.parse(body);

    // 3. For new bookings (dummy patient ID), skip patient validation
    const isNewBooking = validatedData.patientId === '00000000-0000-0000-0000-000000000000';
    let patientName = 'مريض جديد';
    
    if (!isNewBooking) {
      // Verify patient exists and belongs to clinic
      const patient = await db
        .select()
        .from(patients)
        .where(and(
          eq(patients.id, validatedData.patientId),
          eq(patients.clinicId, clinicId)
        ))
        .limit(1);

      if (patient.length === 0) {
        return NextResponse.json(
          { error: 'Patient not found or does not belong to this clinic', code: 'PATIENT_NOT_FOUND' },
          { status: 404 }
        );
      }
      
      patientName = patient[0].fullName;
    }

    // 4. Get active doctors (filtered by preference if provided)
    const doctorsQuery = db
      .select({
        id: users.id,
        name: users.name,
        specialtyId: users.specialtyId,
      })
      .from(users)
      .where(and(
        eq(users.clinicId, clinicId),
        eq(users.role, 'doctor'),
        eq(users.isActive, true)
      ));

    // Filter by preferred doctors if specified
    let doctors = await doctorsQuery;
    if (validatedData.preferredDoctors && validatedData.preferredDoctors.length > 0) {
      doctors = doctors.filter(d => validatedData.preferredDoctors?.includes(d.id));
      // If no preferred doctors found, fallback to all doctors
      if (doctors.length === 0) {
        doctors = await doctorsQuery;
      }
    }

    if (doctors.length === 0) {
      return NextResponse.json(
        { error: 'No doctors available for scheduling', code: 'NO_DOCTORS' },
        { status: 400 }
      );
    }

    // 5. Calculate date range (next N days)
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < validatedData.maxWaitDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip excluded dates
      if (!validatedData.excludeDates?.includes(dateStr)) {
        dates.push(dateStr);
      }
    }

    // 6. Fetch availability for each doctor and date
    const doctorAvailabilities: DoctorAvailability[] = [];

    for (const date of dates) {
      const dayOfWeek = new Date(date).getDay();

      for (const doctor of doctors) {
        // Check if doctor is on leave
        const leaveCheck = await db
          .select()
          .from(doctorLeaves)
          .where(and(
            eq(doctorLeaves.clinicId, clinicId),
            eq(doctorLeaves.doctorId, doctor.id),
            eq(doctorLeaves.leaveDate, date)
          ))
          .limit(1);

        if (leaveCheck.length > 0) {
          continue; // Doctor is on leave
        }

        // Get availability config
        const availabilityConfig = await db
          .select()
          .from(availabilitySlots)
          .where(and(
            eq(availabilitySlots.clinicId, clinicId),
            eq(availabilitySlots.doctorId, doctor.id),
            eq(availabilitySlots.dayOfWeek, dayOfWeek)
          ))
          .limit(1);

        if (availabilityConfig.length === 0) {
          continue; // No availability for this day
        }

        const config = availabilityConfig[0];

        // Get booked appointments
        const bookedAppointments = await db
          .select({ startTime: appointments.startTime })
          .from(appointments)
          .where(and(
            eq(appointments.clinicId, clinicId),
            eq(appointments.doctorId, doctor.id),
            eq(appointments.appointmentDate, date),
            or(
              eq(appointments.status, 'confirmed'),
              eq(appointments.status, 'pending')
            )
          ));

        const booked = bookedAppointments.map(a => ({ 
          startTime: a.startTime 
        }));

        const occupied = buildOccupiedRanges(
          booked,
          config.slotDurationMinutes,
          config.bufferAfterMinutes
        );

        const allSlots = generateSlots(config, occupied);
        const availableSlots = allSlots
          .filter(s => s.isAvailable)
          .map(s => s.time);

        if (availableSlots.length > 0) {
          doctorAvailabilities.push({
            doctorId: doctor.id,
            doctorName: doctor.name || 'الدكتور',
            specialtyId: doctor.specialtyId || undefined,
            date,
            availableSlots,
            config: {
              slotDurationMinutes: config.slotDurationMinutes,
            },
          });
        }
      }
    }

    // 7. Build auto-schedule request
    const autoScheduleRequest: AutoScheduleRequest = {
      patientId: validatedData.patientId,
      priority: validatedData.priority,
      preferences: {
        preferredDoctors: validatedData.preferredDoctors,
        preferredTimeRange: validatedData.preferredTimeRange,
        avoidDays: validatedData.avoidDays,
        maxWaitDays: validatedData.maxWaitDays,
        flexibleWithTime: validatedData.flexibleWithTime,
      },
      excludeDates: validatedData.excludeDates,
    };

    // 8. Find best appointments
    const result = findBestAppointments(autoScheduleRequest, doctorAvailabilities);

    // 9. Format suggestions for display
    const formattedSuggestions = result.suggestions.map(slot => ({
      ...slot,
      formatted: formatSuggestion(slot, 'ar-SA'),
    }));

    // 10. Log the scheduling attempt
    logAutoSchedule(validatedData.patientId, result, Date.now() - startTime);

    return NextResponse.json({
      data: {
        suggestions: formattedSuggestions,
        bestMatch: result.bestMatch ? {
          ...result.bestMatch,
          formatted: formatSuggestion(result.bestMatch, 'ar-SA'),
        } : null,
        totalOptions: result.totalOptions,
        alternativeDates: result.alternativeDates,
        waitlistRecommended: result.waitlistRecommended,
        patientName: patientName,
      },
      message: result.waitlistRecommended 
        ? 'تم العثور على مواعيد محدودة. يوصى بالانضمام إلى قائمة الانتظار.'
        : `تم العثور على ${result.suggestions.length} اقتراحات موعد`,
    });

  } catch (error) {
    console.error('Auto-scheduling error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          code: 'VALIDATION_ERROR',
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate schedule suggestions', 
        code: 'SCHEDULING_ERROR' 
      },
      { status: 500 }
    );
  }
}
