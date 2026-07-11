import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { can } from './lib/permissions';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication for public API and page routes
  if (pathname.startsWith('/api/health') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/public') ||
      pathname.startsWith('/api/portal/auth') || // Patient portal auth endpoints
      pathname === '/dashboard/login' ||
      pathname === '/admin/login' ||
      pathname === '/admin/clinics' ||
      pathname === '/super-admin/login' ||
      pathname === '/api/super-admin/login' ||
      pathname === '/api/super-admin/logout' ||
      pathname.startsWith('/super-admin') ||
      pathname.startsWith('/book/') ||
      pathname.startsWith('/portal/login') ||
      pathname.startsWith('/portal/register') ||
      pathname.startsWith('/portal/forgot-password')) {
    return NextResponse.next();
  }

  // Protect /api/admin routes - require super_admin role ONLY
  if (pathname.startsWith('/api/admin')) {
    // Read token from httpOnly cookie instead of Authorization header
    const cookieToken = request.cookies.get('auth_token')?.value;

    if (!cookieToken) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = cookieToken;

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Check if role is super_admin
      if (payload.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Forbidden: Super Admin access required', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
  }

  // Protect /api/super-admin routes - require super_admin role ONLY
  // Skip login and logout endpoints
  if (pathname.startsWith('/api/super-admin') &&
      !pathname.includes('/login') &&
      !pathname.includes('/logout')) {
    // Read token from httpOnly cookie instead of Authorization header
    const cookieToken = request.cookies.get('auth_token')?.value;

    if (!cookieToken) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = cookieToken;

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Check if role is super_admin
      if (payload.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Forbidden: Super Admin access required', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
  }

  // Protect /api/clinics routes - 3-tier RBAC enforcement
  if (pathname.startsWith('/api/clinics')) {
    // Read token from httpOnly cookie instead of Authorization header
    const cookieToken = request.cookies.get('auth_token')?.value;

    if (!cookieToken) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = cookieToken;

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Add user info to request headers for use in API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);
      if (payload.clinicId) {
        requestHeaders.set('x-clinic-id', payload.clinicId as string);
      }

      // Extract clinic ID from path: /api/clinics/[id]/...
      const pathMatch = pathname.match(/^\/api\/clinics\/([^\/]+)/);
      const clinicIdFromPath = pathMatch ? pathMatch[1] : null;

      // Level 1: Super Admin (Global) - Full access to all clinics
      if (payload.role === 'super_admin') {
        // Super Admin can access any clinic
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }

      // Level 2: Clinic Admin (Tenant Owner) - Full control over their clinic only
      if (payload.role === 'clinic_admin') {
        if (clinicIdFromPath) {
          const userClinicId = payload.clinicId as string | undefined;
          
          // Clinic Admin must have a clinic and can only access their own clinic
          if (!userClinicId || userClinicId !== clinicIdFromPath) {
            return NextResponse.json(
              {
                error: 'Forbidden: You can only access your own clinic',
                code: 'FORBIDDEN',
              },
              { status: 403 }
            );
          }
        }
        
        // Clinic Admins can access all clinic routes (staff, patients, appointments, etc.)
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }

      // Level 3: Staff (Doctors/Receptionists) - Limited permissions
      if (payload.role === 'doctor' || payload.role === 'receptionist') {
        if (clinicIdFromPath) {
          const userClinicId = payload.clinicId as string | undefined;
          
          // Staff must belong to the clinic they're accessing
          if (!userClinicId || userClinicId !== clinicIdFromPath) {
            return NextResponse.json(
              {
                error: 'Forbidden: You can only access your assigned clinic',
                code: 'FORBIDDEN',
              },
              { status: 403 }
            );
          }
        }

        // Get fresh permissions from database to ensure latest state
        let userPermissions = payload.permissions as Record<string, string[]> | undefined;

        // Try to fetch fresh permissions from database
        try {
          const dbUser = await db
            .select({ permissions: users.permissions })
            .from(users)
            .where(eq(users.id, payload.userId as string))
            .limit(1);

          if (dbUser.length > 0 && dbUser[0].permissions) {
            userPermissions = dbUser[0].permissions as Record<string, string[]>;
          }
        } catch {
          // Fallback to JWT permissions if DB fetch fails
          console.error('[middleware] Failed to fetch fresh permissions, using JWT fallback');
        }

        // Staff cannot access staff management routes (except GET for reading)
        const isStaffManagement = pathname.match(/\/api\/clinics\/[^\/]+\/staff/);
        if (isStaffManagement && request.method !== 'GET') {
          return NextResponse.json(
            {
              error: 'Forbidden: Staff cannot modify staff management',
              code: 'FORBIDDEN',
            },
            { status: 403 }
          );
        }

        // Staff cannot access clinic settings
        const isSettings = pathname.match(/\/api\/clinics\/[^\/]+\/(settings|reports)/);
        if (isSettings) {
          return NextResponse.json(
            {
              error: 'Forbidden: Staff cannot access clinic settings',
              code: 'FORBIDDEN',
            },
            { status: 403 }
          );
        }

        // Check granular permissions for each module
        const moduleMatch = pathname.match(/\/api\/clinics\/[^\/]+\/([^\/]+)/);
        if (moduleMatch) {
          const moduleName = moduleMatch[1].replace(/-/g, '_'); // Convert dashes to underscores to match database keys
          // Map HTTP methods to CRUD actions
          const action: PermissionAction = request.method === 'GET' ? 'view' :
                         request.method === 'POST' ? 'create' :
                         request.method === 'DELETE' ? 'delete' : 'edit';

          // Special case: Allow GET for specialties and staff without granular permission check
          // This is needed for dropdowns in appointment booking and staff management
          if ((moduleName === 'specialties' || moduleName === 'staff') && request.method === 'GET') {
            // Skip granular permission check, tenant validation is handled in the route
          } else {
            // Use centralized permission checking
            // Check if user has permission for this module and action
            if (!can(userPermissions, moduleName, action)) {
              return NextResponse.json(
                {
                  error: `Forbidden: You do not have ${action} permission for ${moduleName}`,
                  code: 'PERMISSION_DENIED',
                },
                { status: 403 }
              );
            }
          }
        }

        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }

      // Unknown role
      return NextResponse.json(
        {
          error: 'Forbidden: Invalid role',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }
  }

  // Protect /dashboard routes — check token from cookie for page navigation
  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login')) {
    // For non-API dashboard routes, read token from cookie
    const cookieToken = request.cookies.get('auth_token')?.value;

    if (cookieToken) {
      try {
        const { payload } = await jwtVerify(cookieToken, JWT_SECRET);

        // Level 1: Super Admin - Can access admin dashboard
        if (payload.role === 'super_admin') {
          // Super Admin can access /admin routes, redirect if on /dashboard
          if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login')) {
            return NextResponse.redirect(new URL('/admin', request.url));
          }
        }

        // Level 2: Clinic Admin - Can access all dashboard routes for their clinic
        if (payload.role === 'clinic_admin') {
          // Note: Module access control is now handled by layout.tsx with UnauthorizedPage
          // Middleware only handles authentication, not module-based authorization
          return NextResponse.next();
        }

        // Level 3: Staff (Doctors/Receptionists) - Limited dashboard access
        if (payload.role === 'doctor' || payload.role === 'receptionist') {
          let userPermissions = payload.permissions as Record<string, string[]> | undefined;

          // Try to fetch fresh permissions from database
          try {
            const dbUser = await db
              .select({ permissions: users.permissions })
              .from(users)
              .where(eq(users.id, payload.userId as string))
              .limit(1);

            if (dbUser.length > 0 && dbUser[0].permissions) {
              userPermissions = dbUser[0].permissions as Record<string, string[]>;
            }
          } catch {
            // Fallback to JWT permissions if DB fetch fails
            console.error('[middleware] Failed to fetch fresh permissions, using JWT fallback');
          }

          // Always allow dashboard home
          if (pathname === '/dashboard') {
            return NextResponse.next();
          }

          // Note: Module access control is now handled by layout.tsx with UnauthorizedPage
          // Middleware only checks granular permissions for actions (view, create, edit, delete)

          // Use centralized permission checking with canView helper
          const moduleName = pathname.replace('/dashboard/', '').split('/')[0].replace(/-/g, '_');
          if (!can(userPermissions, moduleName, 'view')) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }

          return NextResponse.next();
        }
      } catch {
        // Invalid token — let the page handle auth redirect
      }
    }
  }

  // Protect /api/portal routes - require patient role
  if (pathname.startsWith('/api/portal') && !pathname.startsWith('/api/portal/auth')) {
    const cookieToken = request.cookies.get('patient_auth_token')?.value;

    if (!cookieToken) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(cookieToken, JWT_SECRET);

      // Check if role is patient
      if (payload.role !== 'patient') {
        return NextResponse.json(
          { error: 'Forbidden: Patient access required', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Add patient info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-patient-id', payload.patientId as string);
      requestHeaders.set('x-patient-account-id', payload.patientAccountId as string);

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
  }

  // Protect /portal routes - check patient token from cookie for page navigation
  if (pathname.startsWith('/portal') &&
      !pathname.startsWith('/portal/login') &&
      !pathname.startsWith('/portal/register') &&
      !pathname.startsWith('/portal/forgot-password')) {
    const cookieToken = request.cookies.get('patient_auth_token')?.value;

    if (!cookieToken) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(cookieToken, JWT_SECRET);

      // Check if role is patient
      if (payload.role !== 'patient') {
        return NextResponse.redirect(new URL('/portal/login', request.url));
      }

      // Allow access to portal routes
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
  }

  return NextResponse.next();
}

// Middleware matcher configuration
export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/book/:path*',
    '/portal/:path*'
  ],
};
