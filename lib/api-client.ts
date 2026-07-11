const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: string | object | BodyInit | null;
};

/**
 * Fetch fresh user permissions from the database
 * Call this when admin changes permissions to sync localStorage with DB
 * Uses /api/auth/me endpoint which doesn't require staff:read permission
 */
export async function refreshUserPermissions(): Promise<void> {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);

    // Fetch current user's data from dedicated /api/auth/me endpoint
    // Token is now in httpOnly cookie, no Authorization header needed
    const response = await fetch('/api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data?.user && data.data.user.permissions !== undefined) {
        const updatedPermissions = data.data.user.permissions;
        const permissionsChanged = JSON.stringify(updatedPermissions) !== JSON.stringify(user.permissions);

        if (permissionsChanged) {
          user.permissions = updatedPermissions;
          localStorage.setItem('user', JSON.stringify(user));
          console.log('[api-client] Permissions refreshed from database:', updatedPermissions);
          // Trigger a page re-render to update UI
          window.location.reload();
        }
      }
    }
  } catch (e) {
    console.error('[api-client] Failed to refresh permissions:', e);
    // Don't throw error to avoid blocking the application
  }
}

export async function apiFetch(path: string, options: ApiOptions = {}) {
  // Token is now stored in httpOnly cookie, no need to read from localStorage
  // Cookies are sent automatically with requests
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // No Authorization header - token is sent via httpOnly cookie
    ...(user?.id && { 'x-user-id': user.id }),
    ...(user?.role && { 'x-user-role': user.role }),
    ...((options.headers as Record<string, string>) || {}),
  };

  const body = options.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  if (response.status === 401) {
    // Token is in cookie, no need to remove from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    localStorage.removeItem('user');
    // Redirect super_admin to /admin/login, others to /dashboard/login
    window.location.href = user?.role === 'super_admin' ? '/admin/login' : '/dashboard/login';
    throw new Error('Unauthorized');
  }

  // Check if response contains updated user data with new permissions
  if (response.ok && (path.includes('/staff') || path.includes('/auth'))) {
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();

      // If the response contains user data with permissions, update localStorage
      if (data.data?.user) {
        const updatedUser = data.data.user;
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        // Update permissions if they exist in the response
        if (updatedUser.permissions !== undefined) {
          const permissionsChanged = JSON.stringify(updatedUser.permissions) !== JSON.stringify(currentUser.permissions);

          if (permissionsChanged) {
            currentUser.permissions = updatedUser.permissions;
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('[api-client] Permissions updated:', updatedUser.permissions);
          }

          // Update token if provided (for login responses)
          if (data.data.token) {
            localStorage.setItem('token', data.data.token);
          }
        }
      }

      // Also check for staff list updates and refresh user permissions from the list
      if (data.data && Array.isArray(data.data)) {
        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
        const updatedStaffMember = data.data.find((staff: any) => staff.id === currentUserId);

        if (updatedStaffMember && updatedStaffMember.permissions !== undefined) {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const permissionsChanged = JSON.stringify(updatedStaffMember.permissions) !== JSON.stringify(currentUser.permissions);

          if (permissionsChanged) {
            currentUser.permissions = updatedStaffMember.permissions;
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('[api-client] Permissions updated from staff list:', updatedStaffMember.permissions);
          }
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }

  return response;
}
