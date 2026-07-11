import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST /api/super-admin/logout
 * Super Admin logout endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Clear auth_token cookie
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error during super admin logout:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
