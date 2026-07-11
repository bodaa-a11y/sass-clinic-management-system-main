import { logoutPatient } from '@/lib/portal/auth';
import { verifyPatientToken } from '@/lib/portal/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('patient_auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No active session', code: 'NO_SESSION' },
        { status: 401 }
      );
    }

    // Verify token and logout
    await logoutPatient(token);

    // Clear the cookie
    cookieStore.delete('patient_auth_token');

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
