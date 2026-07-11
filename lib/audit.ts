import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_PATIENT'
  | 'UPDATE_PATIENT'
  | 'DELETE_PATIENT'
  | 'CREATE_APPOINTMENT'
  | 'UPDATE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'CREATE_MEDICAL_RECORD'
  | 'UPDATE_MEDICAL_RECORD'
  | 'CREATE_PRESCRIPTION'
  | 'UPDATE_PRESCRIPTION'
  | 'DELETE_PRESCRIPTION'
  | 'CREATE_INVOICE'
  | 'UPDATE_INVOICE'
  | 'CREATE_PAYMENT'
  | 'CREATE_STAFF'
  | 'UPDATE_STAFF'
  | 'DELETE_STAFF'
  | 'UPDATE_SETTINGS'
  | 'ADMIN_VIEW_CLINICS'
  | 'ADMIN_CREATE_CLINIC';

interface AuditLogInput {
  clinicId?: string;
  userId?: string;
  userRole?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  if (process.env.AUDIT_LOG_ENABLED === 'false') {
    return;
  }

  try {
    await db.insert(auditLogs).values({
      clinicId: input.clinicId,
      userId: input.userId,
      userRole: input.userRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues ? JSON.stringify(input.oldValues) : null,
      newValues: input.newValues ? JSON.stringify(input.newValues) : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  } catch (error) {
    // Log to console if audit logging fails, but don't break the main flow
    console.error('Failed to write audit log:', error);
  }
}
