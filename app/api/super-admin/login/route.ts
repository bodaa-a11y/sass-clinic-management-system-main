import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, signToken } from '@/lib/auth'

/**
 * POST /api/super-admin/login
 * Super Admin login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Login attempt for email:', email)

    // Find super admin user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    console.log('User found:', user.length > 0 ? 'Yes' : 'No')

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const userData = user[0]

    console.log('User role:', userData.role)

    // Check if user is super_admin
    if (userData.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied. Super admin only.' },
        { status: 403 }
      )
    }

    // Check if user is active
    if (!userData.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    console.log('Verifying password...')

    // Verify password
    const isPasswordValid = await verifyPassword(password, userData.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('Password valid, generating token...')

    // Generate JWT token
    const token = await signToken({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      clinicId: userData.clinicId,
    })

    console.log('Token generated, setting cookie...')

    // Set token in httpOnly cookie using NextResponse
    const response = NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clinicId: userData.clinicId,
        isActive: userData.isActive,
      },
      token,
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log('Login successful')
    return response
  } catch (error) {
    console.error('Error during super admin login:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
