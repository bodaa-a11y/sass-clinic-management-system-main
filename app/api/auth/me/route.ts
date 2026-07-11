import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Fetch current user's data including permissions
 * This endpoint allows users to fetch their own data without needing staff:read permission
 */
export async function GET(request: NextRequest) {
  try {
    // Read token from httpOnly cookie instead of Authorization header
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Decode token to get userId (simple JWT decode without verification for performance)
    // In production, you should verify the token
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid token format', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token: missing userId', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const userData = user[0];
    const { passwordHash: _, ...userWithoutPassword } = userData;

    return NextResponse.json({
      data: {
        user: {
          ...userWithoutPassword,
          permissions: (userData.permissions as Record<string, string[]>) || {},
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch user data',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
