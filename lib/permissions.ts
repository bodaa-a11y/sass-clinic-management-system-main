/**
 * Permission System for Clinic Management API
 * 
 * Maps HTTP methods + routes to specific permissions
 * Combines with tenant validation for complete access control
 * Centralized permission management for dynamic RBAC
 */

import { NextRequest, NextResponse } from 'next/server';

// Permission types
export type Permission =
  // Patients
  | 'patients:read' | 'patients:create' | 'patients:update' | 'patients:delete'
  // Appointments
  | 'appointments:read' | 'appointments:create' | 'appointments:update' | 'appointments:delete' | 'appointments:cancel'
  // Medical Records
  | 'medical_records:read' | 'medical_records:create' | 'medical_records:update' | 'medical_records:delete'
  // Prescriptions
  | 'prescriptions:read' | 'prescriptions:create' | 'prescriptions:update' | 'prescriptions:delete'
  // Lab Results
  | 'lab_results:read' | 'lab_results:create' | 'lab_results:update' | 'lab_results:delete'
  // Radiology Images
  | 'radiology_images:read' | 'radiology_images:create' | 'radiology_images:update' | 'radiology_images:delete'
  // Medical Documents
  | 'medical_documents:read' | 'medical_documents:create' | 'medical_documents:update' | 'medical_documents:delete' | 'medical_documents:approve'
  // Lab Integrations
  | 'lab_integrations:read' | 'lab_integrations:create' | 'lab_integrations:update' | 'lab_integrations:delete'
  // Invoices
  | 'invoices:read' | 'invoices:create' | 'invoices:update' | 'invoices:delete'
  // Payments
  | 'payments:read' | 'payments:create' | 'payments:update' | 'payments:delete'
  // Staff
  | 'staff:read' | 'staff:create' | 'staff:update' | 'staff:delete'
  // Settings
  | 'settings:read' | 'settings:update'
  // Admin
  | 'admin:full_access';

// Module-based permission structure (matches database format)
export type ModulePermissions = Record<string, string[]>;

// Standard module names (must match MODULES constant in staff-management)
export const STANDARD_MODULES = [
  'patients',
  'appointments',
  'medical_records',
  'prescriptions',
  'lab_results',
  'radiology_images',
  'medical_documents',
  'lab_integrations',
  'invoices',
  'payments',
  'specialties',
  'calendar',
  'schedule',
  'live-monitor',
  'staff-management',
  'staff_management_limited',
] as const;

// Permission action types - CRUD operations
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'patients:read', 'patients:create', 'patients:update', 'patients:delete',
    'appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete',
    'medical_records:read', 'medical_records:create', 'medical_records:update', 'medical_records:delete',
    'prescriptions:read', 'prescriptions:create', 'prescriptions:update', 'prescriptions:delete',
    'lab_results:read', 'lab_results:create', 'lab_results:update', 'lab_results:delete',
    'radiology_images:read', 'radiology_images:create', 'radiology_images:update', 'radiology_images:delete',
    'medical_documents:read', 'medical_documents:create', 'medical_documents:update', 'medical_documents:delete',
    'lab_integrations:read', 'lab_integrations:create', 'lab_integrations:update', 'lab_integrations:delete',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete',
    'payments:read', 'payments:create', 'payments:update', 'payments:delete',
    'staff:read', 'staff:create', 'staff:update', 'staff:delete',
    'settings:read', 'settings:update',
    'admin:full_access',
  ],
  clinic_admin: [
    'patients:read', 'patients:create', 'patients:update', 'patients:delete',
    'appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete',
    'medical_records:read', 'medical_records:create', 'medical_records:update', 'medical_records:delete',
    'prescriptions:read', 'prescriptions:create', 'prescriptions:update', 'prescriptions:delete',
    'lab_results:read', 'lab_results:create', 'lab_results:update', 'lab_results:delete',
    'radiology_images:read', 'radiology_images:create', 'radiology_images:update', 'radiology_images:delete',
    'medical_documents:read', 'medical_documents:create', 'medical_documents:update', 'medical_documents:delete',
    'lab_integrations:read', 'lab_integrations:create', 'lab_integrations:update', 'lab_integrations:delete',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete',
    'payments:read', 'payments:create', 'payments:update', 'payments:delete',
    'staff:read', 'staff:create', 'staff:update', 'staff:delete',
    'settings:read', 'settings:update',
    'admin:full_access',
  ],
  doctor: [
    'patients:read', 'patients:create',
    'appointments:read', 'appointments:create', 'appointments:update',
    'medical_records:read', 'medical_records:create', 'medical_records:update',
    'prescriptions:read', 'prescriptions:create', 'prescriptions:update',
    'lab_results:read', 'lab_results:create', 'lab_results:update',
    'radiology_images:read', 'radiology_images:create',
    'medical_documents:read', 'medical_documents:create',
    'invoices:read',
    'payments:read',
    'settings:read',
  ],
  receptionist: [
    'patients:read', 'patients:create', 'patients:update',
    'appointments:read', 'appointments:create', 'appointments:update',
    'lab_results:read',
    'medical_documents:read', 'medical_documents:create', 'medical_documents:approve',
    'invoices:read', 'invoices:create', 'invoices:update',
    'payments:read', 'payments:create',
    'staff:read',
    'settings:read',
  ],
  nurse: [
    'patients:read',
    'appointments:read',
    'medical_records:read', 'medical_records:create', 'medical_records:update',
    'lab_results:read',
    'medical_documents:read',
    'settings:read',
  ],
};

// Route to permission mapping
// Format: [method]:[resource]:[action]
export function getRequiredPermission(
  method: string,
  resource: string
): Permission | null {
  const action = methodToAction(method);
  if (!action) return null;

  // Map resource names
  const resourceMap: Record<string, string> = {
    'patients': 'patients',
    'appointments': 'appointments',
    'medical-records': 'medical_records',
    'prescriptions': 'prescriptions',
    'lab-results': 'lab_results',
    'radiology-images': 'radiology_images',
    'medical-documents': 'medical_documents',
    'lab-integrations': 'lab_integrations',
    'invoices': 'invoices',
    'payments': 'payments',
    'staff': 'staff',
    'clinic': 'settings', // settings/clinic endpoint
    'availability': 'settings',
    'schedule-exceptions': 'settings',
    'specialties': 'specialties',
    'leaves': 'staff',
    'waitlist': 'appointments',
    'reports': 'settings',
  };

  const mappedResource = resourceMap[resource] || resource;
  return `${mappedResource}:${action}` as Permission;
}

function methodToAction(method: string): string | null {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'read';
    case 'POST':
      return 'create';
    case 'PATCH':
    case 'PUT':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return null;
  }
}

// Check if user has permission
export function hasPermission(userRole: string, permission: Permission, userPermissions?: Record<string, string[]> | null): boolean {
  // Super admin bypass - can do anything
  if (userRole === 'super_admin') return true;

  // Map old permission format to new granular format for non-super_admin roles
  const [resource, action] = permission.split(':');
  const mappedAction = action === 'read' ? 'view' : (action === 'create' ? 'create' : (action === 'update' ? 'edit' : 'delete'));

  // Check dynamic permissions from DB if they exist (for doctor and receptionist)
  // Treat empty object {} as no permissions set, use fallback
  const hasDynamicPermissions = userPermissions && Object.keys(userPermissions).length > 0;
  if (hasDynamicPermissions && userPermissions[resource]) {
    const modulePerms = userPermissions[resource] || [];
    return modulePerms.includes(mappedAction);
  }

  // Fallback to default role permissions if not explicitly overridden for this resource
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.includes(permission) : false;
}

// Permission check result
export interface PermissionCheckResult {
  success: boolean;
  response?: NextResponse;
  userId?: string;
  userRole?: string;
  clinicId?: string;
}

/**
 * Check permission for a request
 * Must be called AFTER tenant validation to ensure we have user context
 */
export function checkPermission(
  request: NextRequest,
  resource: string,
  method: string,
  userId: string,
  userRole: string,
  userPermissions?: Record<string, string[]> | null
): PermissionCheckResult {
  const requiredPermission = getRequiredPermission(method, resource);

  if (!requiredPermission) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid request method',
          code: 'METHOD_NOT_ALLOWED',
        },
        { status: 405 }
      ),
    };
  }

  if (!hasPermission(userRole, requiredPermission, userPermissions)) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Permission denied',
          code: 'PERMISSION_DENIED',
          required: requiredPermission,
          role: userRole,
        },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    userId,
    userRole,
  };
}

/**
 * Combined tenant + permission check
 * Extracts user context from headers and validates both tenant access and permissions
 */
export async function checkAccess(
  request: NextRequest,
  clinicId: string,
  resource: string,
  method: string
): Promise<PermissionCheckResult> {
  // Extract user context from headers (set by middleware)
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const userClinicId = request.headers.get('x-clinic-id');

  // 401 - Not authenticated (missing user context)
  if (!userId || !userRole) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHENTICATED',
        },
        { status: 401 }
      ),
    };
  }

  // Super admin bypasses tenant check but still needs valid role
  if (userRole === 'super_admin') {
    // Super admins still need permission check for non-admin routes
    if (!resource.startsWith('admin')) {
      const permissionCheck = checkPermission(request, resource, method, userId, userRole, null);
      if (!permissionCheck.success) {
        return permissionCheck;
      }
    }
    return { success: true, userId, userRole, clinicId };
  }

  // 403 - Tenant scope violation (wrong clinic)
  if (userClinicId && userClinicId !== clinicId) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Access denied: Cannot access data from another clinic',
          code: 'TENANT_SCOPE_VIOLATION',
        },
        { status: 403 }
      ),
    };
  }

  // Note: checkAccess handles routes that ONLY rely on headers. 
  // It cannot provide granular userPermissions since they are omitted from headers.
  // We recommend using validateTenantScope instead for routes needing strict RBAC.
  const permissionCheck = checkPermission(request, resource, method, userId, userRole, null);
  if (!permissionCheck.success) {
    return permissionCheck;
  }

  return { success: true, userId, userRole, clinicId };
}

// Admin route permission check
export function checkAdminAccess(
  request: NextRequest,
  userId: string,
  userRole: string
): PermissionCheckResult {
  if (userRole !== 'super_admin') {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Admin access required',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
        { status: 403 }
      ),
    };
  }

  return { success: true, userId, userRole };
}

/**
 * Get default module-based permissions for a role
 * Returns the permissions object that should be stored in users.permissions
 * Includes CRUD operations: view, create, edit, delete
 */
export function getDefaultModulePermissions(role: string): ModulePermissions {
  const defaults: ModulePermissions = {};

  if (role === 'doctor') {
    defaults.patients = ['view', 'create', 'edit'];
    defaults.appointments = ['view', 'create', 'edit', 'delete'];
    defaults.medical_records = ['view', 'create', 'edit'];
    defaults.prescriptions = ['view', 'create', 'edit'];
    defaults.lab_results = ['view', 'create', 'edit'];
    defaults.radiology_images = ['view', 'create'];
    defaults.medical_documents = ['view', 'create'];
    defaults.specialties = ['view'];
    defaults.calendar = ['view'];
    defaults.schedule = ['view'];
    defaults['live-monitor'] = ['view'];
    // Doctors cannot access invoices or payments
  } else if (role === 'receptionist') {
    defaults.patients = ['view', 'create', 'edit'];
    defaults.appointments = ['view', 'create', 'edit', 'delete'];
    defaults.lab_results = ['view'];
    defaults.medical_documents = ['view', 'create', 'approve'];
    defaults.invoices = ['view', 'create', 'edit'];
    defaults.payments = ['view', 'create', 'edit'];
    defaults.medical_records = ['view'];
    defaults.specialties = ['view'];
    defaults.calendar = ['view'];
    defaults.schedule = ['view'];
    defaults['live-monitor'] = ['view'];
    // Receptionists cannot modify prescriptions
  } else if (role === 'nurse') {
    defaults.patients = ['view'];
    defaults.appointments = ['view'];
    defaults.medical_records = ['view', 'create', 'edit'];
    defaults.lab_results = ['view'];
    defaults.medical_documents = ['view'];
    defaults.specialties = ['view'];
    defaults.calendar = ['view'];
    defaults.schedule = ['view'];
    defaults['live-monitor'] = ['view'];
    // Nurses cannot access invoices, payments, or prescriptions
  } else if (role === 'clinic_admin') {
    // Clinic admins have full access to all modules including staff_management
    STANDARD_MODULES.forEach(module => {
      defaults[module] = ['view', 'create', 'edit', 'delete'];
    });
    defaults.lab_results = ['view', 'create', 'edit', 'delete'];
    defaults.radiology_images = ['view', 'create', 'edit', 'delete'];
    defaults.medical_documents = ['view', 'create', 'edit', 'delete'];
    defaults.lab_integrations = ['view', 'create', 'edit', 'delete'];
    // Also add vitals for medical center
    defaults.vitals = ['view', 'create', 'edit', 'delete'];
  } else if (role === 'super_admin') {
    // Super admins have full access
    STANDARD_MODULES.forEach(module => {
      defaults[module] = ['view', 'create', 'edit', 'delete'];
    });
    defaults.lab_results = ['view', 'create', 'edit', 'delete'];
    defaults.radiology_images = ['view', 'create', 'edit', 'delete'];
    defaults.medical_documents = ['view', 'create', 'edit', 'delete'];
    defaults.lab_integrations = ['view', 'create', 'edit', 'delete'];
  }

  return defaults;
}

/**
 * Get permissions for a doctor in a single clinic
 * Includes staff_management_limited for adding receptionist only
 */
export function getSingleClinicDoctorPermissions(): ModulePermissions {
  return {
    patients: ['view', 'create', 'edit'],
    appointments: ['view', 'create', 'edit', 'delete'],
    medical_records: ['view', 'create', 'edit'],
    prescriptions: ['view', 'create', 'edit'],
    lab_results: ['view', 'create', 'edit'],
    radiology_images: ['view', 'create'],
    medical_documents: ['view', 'create', 'approve'],
    invoices: ['view'],
    payments: ['view'],
    specialties: ['view'],
    calendar: ['view'],
    schedule: ['view'],
    'live-monitor': ['view'],
    staff_management_limited: ['view', 'create'], // Can add receptionist only
  };
}

/**
 * Check if user has permission for a specific module and action
 * Uses the module-based permission structure from database
 * Implements "edit implies view" rule: if user has create/edit/delete, they automatically get view
 */
export function checkModulePermission(
  userPermissions: ModulePermissions | undefined,
  module: string,
  action: PermissionAction
): boolean {
  // If no permissions defined, deny access (require explicit permissions)
  if (!userPermissions || Object.keys(userPermissions).length === 0) {
    return false;
  }

  const modulePerms = userPermissions[module];
  if (!modulePerms || !Array.isArray(modulePerms)) {
    return false;
  }

  // If action is 'view', check if user has any permission (view, create, edit, delete)
  // This implements the "edit implies view" rule
  if (action === 'view') {
    return modulePerms.length > 0;
  }

  // For other actions (create, edit, delete), check specific permission
  return modulePerms.includes(action);
}

/**
 * Normalize permission names to standard format
 * Maps legacy names to standard module names
 */
export function normalizePermissionName(name: string): string {
  const nameMap: Record<string, string> = {
    'billing': 'invoices',
    'records': 'medical_records',
    'prescriptions': 'prescriptions',
  };

  return nameMap[name] || name;
}

/**
 * Normalize all permissions in a permissions object
 */
export function normalizePermissions(permissions: ModulePermissions): ModulePermissions {
  const normalized: ModulePermissions = {};

  for (const [key, value] of Object.entries(permissions)) {
    const normalizedKey = normalizePermissionName(key);
    normalized[normalizedKey] = value;
  }

  return normalized;
}

/**
 * Initialize permissions for a new user based on role
 * Returns the permissions object to store in database
 */
export function initializeUserPermissions(role: string): ModulePermissions {
  return getDefaultModulePermissions(role);
}

/**
 * Check if user can view a specific module
 * Unified helper for consistent UI permission checking
 * Returns true if user has 'view' permission for the module
 */
export function canView(permissions: ModulePermissions | undefined, module: string): boolean {
  return checkModulePermission(permissions, module, 'view');
}

/**
 * Centralized permission helper function
 * Consistent interface for checking any CRUD permission
 * Implements "edit implies view" rule automatically
 *
 * @param permissions - User's permission object from database
 * @param module - Module name (e.g., 'invoices', 'patients')
 * @param action - Action type ('view', 'create', 'edit', 'delete')
 * @returns true if user has permission for the action
 */
export function can(
  permissions: ModulePermissions | undefined,
  module: string,
  action: PermissionAction
): boolean {
  return checkModulePermission(permissions, module, action);
}
