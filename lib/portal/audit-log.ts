import { db } from '@/db';
import { patientAuditLog } from '@/db/schema';
import { NextRequest } from 'next/server';

interface AuditLogOptions {
  patientId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  request?: NextRequest;
  metadata?: Record<string, unknown>;
}

/**
 * Log patient actions for HIPAA compliance
 * This function should be called for all patient-related actions
 */
export async function logPatientAction(options: AuditLogOptions) {
  const {
    patientId,
    action,
    resourceType,
    resourceId,
    request,
    metadata = {},
  } = options;

  try {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request?.headers.get('user-agent') || 'unknown';

    await db.insert(patientAuditLog).values({
      patientId,
      action,
      resourceType,
      resourceId: resourceId || null,
      ipAddress,
      userAgent,
      metadata: JSON.stringify(metadata),
    });
  } catch (error) {
    // Log errors but don't throw to avoid breaking the main flow
    console.error('Failed to log patient action:', error);
  }
}

/**
 * Common action types for audit logging
 */
export const AuditActions = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  
  // Data Access
  VIEW_MEDICAL_RECORD: 'view_medical_record',
  VIEW_LAB_RESULT: 'view_lab_result',
  VIEW_PRESCRIPTION: 'view_prescription',
  VIEW_APPOINTMENT: 'view_appointment',
  VIEW_INVOICE: 'view_invoice',
  
  // Data Modification
  BOOK_APPOINTMENT: 'book_appointment',
  CANCEL_APPOINTMENT: 'cancel_appointment',
  REQUEST_PRESCRIPTION_REFILL: 'request_prescription_refill',
  SEND_MESSAGE: 'send_message',
  
  // Profile
  UPDATE_PROFILE: 'update_profile',
  UPDATE_PREFERENCES: 'update_preferences',
  
  // Billing
  PAY_INVOICE: 'pay_invoice',
  DOWNLOAD_INVOICE: 'download_invoice',
  
  // Documents
  DOWNLOAD_DOCUMENT: 'download_document',
  EXPORT_DATA: 'export_data',
} as const;

/**
 * Resource types for audit logging
 */
export const ResourceTypes = {
  MEDICAL_RECORD: 'medical_record',
  LAB_RESULT: 'lab_result',
  PRESCRIPTION: 'prescription',
  APPOINTMENT: 'appointment',
  INVOICE: 'invoice',
  MESSAGE: 'message',
  PROFILE: 'profile',
  DOCUMENT: 'document',
} as const;
