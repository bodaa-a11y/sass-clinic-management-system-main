import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface AdminContext {
  userId: string;
  userRole: string;
  email: string;
}

/**
 * Validates that the requesting user is a super admin.
 * 
 * Super admins can access all admin routes and manage all clinics.
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ success: boolean; response?: NextResponse; context?: AdminContext }> {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (!userId || !userRole) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Missing user context', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  // Check if user is super admin
  if (userRole !== 'super_admin') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden: Super admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    };
  }

  // Fetch user details from database to verify they still exist and are active
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: User not found', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  const userData = user[0];

  if (!userData.isActive) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: User account is disabled', code: 'ACCOUNT_DISABLED' },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    context: {
      userId: userData.id,
      userRole: userData.role,
      email: userData.email,
    },
  };
}
