import { z } from 'zod';
import { db } from '@/db';
import { clinics, users } from '@/db/schema';
import { verifyPassword, signToken } from '@/lib/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Stricter rate limiting for login (5 attempts per 15 minutes)
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP + email combination
    const ip = getClientIP(request);
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    
    const rateLimitKey = `login:${ip}:${validatedData.email}`;
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

    const user = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, validatedData.email),
          eq(users.isActive, true),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (user.length === 0) {
      // Log failed login attempt
      await logAudit({
        action: 'LOGIN',
        entityType: 'user',
        entityId: validatedData.email,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });
      
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(validatedData.password, user[0].passwordHash);

    if (!isPasswordValid) {
      // Log failed login attempt
      await logAudit({
        action: 'LOGIN',
        entityType: 'user',
        entityId: user[0].id,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        userId: user[0].id,
        userRole: user[0].role,
        clinicId: user[0].clinicId || undefined,
      });
      
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    // Check if clinic_admin's clinic is active and fetch clinic config
    let clinicConfig = null;
    if (user[0].clinicId) {
      try {
        const clinic = await db
          .select({
            id: clinics.id,
            facilityType: clinics.facilityType,
            edition: clinics.edition,
            enabledModules: clinics.enabledModules,
            config: clinics.config,
            isActive: clinics.isActive,
          })
          .from(clinics)
          .where(eq(clinics.id, user[0].clinicId))
          .limit(1);

        if (clinic.length === 0) {
          return NextResponse.json(
            {
              error: 'Clinic not found',
              code: 'CLINIC_NOT_FOUND',
            },
            { status: 404 }
          );
        }

        if (!clinic[0].isActive) {
          return NextResponse.json(
            {
              error: 'هذه العيادة موقوفة، تواصل مع الإدارة',
              code: 'CLINIC_SUSPENDED',
            },
            { status: 403 }
          );
        }

        // Store clinic config to return to client
        const dbEnabledModules = clinic[0].enabledModules as string[];
        const defaultModules = [
          'appointments',
          'patients',
          'medical_records',
          'prescriptions',
          'invoices',
          'payments',
          'specialties',
          'calendar',
          'schedule',
          'live-monitor',
          'staff_management',
          'reports',
          'departments',
        ];

        clinicConfig = {
          facilityType: clinic[0].facilityType,
          edition: clinic[0].edition,
          enabledModules: dbEnabledModules.length > 0 ? dbEnabledModules : defaultModules,
          config: clinic[0].config as Record<string, unknown>,
        };
      } catch (error) {
        // If migration not run yet, clinic config fields don't exist
        // Log error but provide default clinicConfig to enable UI
        console.error('Error fetching clinic config (migration may not be run):', error);

        // Provide default config so sidebar works
        clinicConfig = {
          facilityType: 'single_clinic',
          edition: 'basic',
          enabledModules: [
            'appointments',
            'patients',
            'medical_records',
            'prescriptions',
            'invoices',
            'payments',
            'specialties',
            'calendar',
            'schedule',
            'live-monitor',
          ],
          config: {},
        };
      }
    }

    const { passwordHash: _, ...userWithoutPassword } = user[0];

    // Ensure permissions are included in user object
    const userWithPermissions = {
      ...userWithoutPassword,
      permissions: (user[0].permissions as Record<string, string[]>) || {},
      clinicConfig,
    };

    const token = await signToken({
      userId: user[0].id,
      email: user[0].email,
      role: user[0].role,
      clinicId: user[0].clinicId,
      permissions: (user[0].permissions as Record<string, string[]>) || {},
    });

    // Log successful login
    await logAudit({
      action: 'LOGIN',
      entityType: 'user',
      entityId: user[0].id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      userId: user[0].id,
      userRole: user[0].role,
      clinicId: user[0].clinicId || undefined,
    });

    const response = NextResponse.json({
      data: {
        user: userWithPermissions,
        token,
      },
      message: 'Login successful',
    });

    // Set auth cookie for middleware to read role (dashboard page guards)
    response.cookies.set('auth_token', token, {
      httpOnly: true, // Security: prevent XSS attacks
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Security: prevent CSRF attacks
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
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
        error: error instanceof Error ? error.message : 'Failed to login',
        code: 'LOGIN_ERROR',
      },
      { status: 500 }
    );
  }
}
