import { z } from 'zod';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { registerPatientAccount } from '@/lib/portal/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const registerSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Rate limiting for registration (3 attempts per hour)
const REGISTER_MAX_ATTEMPTS = 3;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Rate limiting by IP
    const rateLimitKey = `register:${ip}`;
    const rateLimitResult = rateLimit(rateLimitKey, REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
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

    // Check if patient exists and is active
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, validatedData.patientId))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found', code: 'PATIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const patientData = patient[0];
    if (!patientData.isActive) {
      return NextResponse.json(
        { error: 'Patient account is not active', code: 'PATIENT_INACTIVE' },
        { status: 400 }
      );
    }

    // Register patient portal account
    const newAccount = await registerPatientAccount({
      patientId: validatedData.patientId,
      email: validatedData.email,
      password: validatedData.password,
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        account: {
          id: newAccount.id,
          email: newAccount.email,
          emailVerified: newAccount.emailVerified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        return NextResponse.json(
          { error: error.message, code: 'EMAIL_EXISTS' },
          { status: 400 }
        );
      }
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
