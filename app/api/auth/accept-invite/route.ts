/**
 * Accept Invite Endpoint
 * 
 * POST /api/auth/accept-invite
 * 
 * Flow:
 * 1. User receives invite email with token
 * 2. User visits /accept-invite?token=xxx
 * 3. User submits password
 * 4. This endpoint validates token and activates account
 */

import { db } from '@/db';
import { users, inviteTokens } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Rate limiting for invite acceptance (5 attempts per hour per IP)
const ACCEPT_INVITE_MAX_ATTEMPTS = 5;
const ACCEPT_INVITE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimitKey = `accept-invite:${ip}`;
    const rateLimitResult = rateLimit(rateLimitKey, ACCEPT_INVITE_MAX_ATTEMPTS, ACCEPT_INVITE_WINDOW_MS);
    
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

    const body = await request.json();
    const validatedData = acceptInviteSchema.parse(body);

    // Find valid invite token
    const now = new Date();
    const invite = await db
      .select()
      .from(inviteTokens)
      .where(
        and(
          eq(inviteTokens.token, validatedData.token),
          eq(inviteTokens.status, 'pending'),
          eq(inviteTokens.isActive, true),
          gt(inviteTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid or expired invite token',
          code: 'INVALID_TOKEN',
        },
        { status: 400 }
      );
    }

    const inviteData = invite[0];

    // Get associated user
    const user = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, inviteData.userId),
          eq(users.status, 'pending')
        )
      )
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found or already activated',
          code: 'USER_NOT_FOUND',
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Update user: set password and activate
    await db
      .update(users)
      .set({
        passwordHash,
        status: 'active',
      })
      .where(eq(users.id, inviteData.userId));

    // Update invite: mark as accepted
    await db
      .update(inviteTokens)
      .set({
        status: 'accepted',
        usedAt: now,
      })
      .where(eq(inviteTokens.id, inviteData.id));

    // Audit logging
    await logAudit({
      action: 'CREATE_STAFF',
      entityType: 'user',
      entityId: inviteData.userId,
      clinicId: inviteData.clinicId,
      userId: inviteData.userId,
      userRole: inviteData.role,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      newValues: {
        email: inviteData.email,
        role: inviteData.role,
        status: 'active',
      },
    });

    return NextResponse.json({
      message: 'Account activated successfully',
      data: {
        userId: inviteData.userId,
        email: inviteData.email,
        role: inviteData.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to accept invite',
        code: 'ACCEPT_ERROR',
      },
      { status: 500 }
    );
  }
}
