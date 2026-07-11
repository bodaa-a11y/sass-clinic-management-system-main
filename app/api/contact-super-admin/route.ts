import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

/**
 * Send a message to Super Admin from clinic admin
 */
export async function POST(request: NextRequest) {
  try {
    // Read token from httpOnly cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, moduleName } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (message.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 1000 characters.', code: 'MESSAGE_TOO_LONG' },
        { status: 400 }
      );
    }

    // Get sender info
    const sender = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        clinicId: users.clinicId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (sender.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get all Super Admins
    const superAdmins = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.role, 'super_admin'));

    if (superAdmins.length === 0) {
      return NextResponse.json(
        { error: 'No Super Admin found', code: 'NO_SUPER_ADMIN' },
        { status: 404 }
      );
    }

    // TODO: Send actual email to all Super Admins
    // For now, just log it
    console.log('[Contact Super Admin]', {
      from: `${sender[0].name} (${sender[0].email})`,
      to: superAdmins.map(sa => sa.email),
      message: message.trim(),
      moduleName: moduleName || null,
    });

    return NextResponse.json({
      message: 'تم إرسال طلبك إلى Super Admin بنجاح',
      data: {
        recipientCount: superAdmins.length,
      },
    });
  } catch (error) {
    console.error('Error sending contact request:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send request',
        code: 'SEND_ERROR',
      },
      { status: 500 }
    );
  }
}
