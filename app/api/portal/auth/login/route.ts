import { z } from 'zod';
import { loginPatient } from '@/lib/portal/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Stricter rate limiting for login (5 attempts per 15 minutes)
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Rate limiting by IP + email combination
    const rateLimitKey = `portal_login:${ip}:${validatedData.email}`;
    const rateLimitResult = rateLimit(rateLimitKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again in 15 minutes.',
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

    // Login patient
    const result = await loginPatient(validatedData.email, validatedData.password);

    // Set httpOnly cookie with the token
    const cookieStore = await cookies();
    cookieStore.set('patient_auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        patient: result.patient,
      },
      { status: 200 }
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
      if (
        error.message === 'Invalid email or password' ||
        error.message === 'Account is deactivated'
      ) {
        return NextResponse.json(
          { error: error.message, code: 'AUTH_FAILED' },
          { status: 401 }
        );
      }
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
