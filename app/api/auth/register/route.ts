import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  clinic_id: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
  role: z.enum(['clinic_admin', 'super_admin']),
});

// Rate limiting for registration (3 attempts per hour per IP)
const REGISTER_MAX_ATTEMPTS = 3;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
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

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: 'Email already registered',
          code: 'DUPLICATE_EMAIL',
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(validatedData.password);

    // Use clinic_id (snake_case from API) or clinicId if provided
    const clinicIdToSave = validatedData.clinic_id || validatedData.clinicId || null;

    const newUser = await db
      .insert(users)
      .values({
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        clinicId: clinicIdToSave,
        isActive: true,
        deletedAt: null,
      })
      .returning();

    const { passwordHash: _, ...userWithoutPassword } = newUser[0];

    // Audit logging
    await logAudit({
      action: 'CREATE_STAFF',
      entityType: 'user',
      entityId: newUser[0].id,
      clinicId: clinicIdToSave || undefined,
      userId: newUser[0].id,
      userRole: newUser[0].role,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: {
        email: newUser[0].email,
        role: newUser[0].role,
      },
    });

    return NextResponse.json(
      {
        data: userWithoutPassword,
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
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
        error: error instanceof Error ? error.message : 'Failed to register user',
        code: 'REGISTER_ERROR',
      },
      { status: 500 }
    );
  }
}
