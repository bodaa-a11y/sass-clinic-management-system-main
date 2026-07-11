import { z } from 'zod';
import { getPatientAccountByEmail } from '@/lib/portal/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Rate limiting for forgot password (3 attempts per hour)
const FORGOT_PASSWORD_MAX_ATTEMPTS = 3;
const FORGOT_PASSWORD_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Rate limiting by IP + email combination
    const rateLimitKey = `forgot_password:${ip}:${validatedData.email}`;
    const rateLimitResult = rateLimit(
      rateLimitKey,
      FORGOT_PASSWORD_MAX_ATTEMPTS,
      FORGOT_PASSWORD_WINDOW_MS
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
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

    // Check if patient account exists
    const account = await getPatientAccountByEmail(validatedData.email);

    if (!account) {
      // Don't reveal that email doesn't exist for security
      return NextResponse.json(
        {
          message: 'If the email exists, a password reset link has been sent',
        },
        { status: 200 }
      );
    }

    // TODO: Generate reset token and send email
    // For now, just return success message
    // In production, you would:
    // 1. Generate a secure reset token
    // 2. Store it in database with expiration
    // 3. Send email with reset link

    return NextResponse.json(
      {
        message: 'If the email exists, a password reset link has been sent',
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

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
