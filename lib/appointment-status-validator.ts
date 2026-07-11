/**
 * Appointment Status Transition Validator
 * Validates status transitions based on business rules and role permissions
 */

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in-waiting-room'
  | 'in-progress'
  | 'done'
  | 'cancelled'
  | 'no-show'

/**
 * Valid status transitions
 * Key = current status, Value = array of allowed next statuses
 */
const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled', 'no-show'],
  confirmed: ['in-waiting-room', 'cancelled', 'no-show'],
  'in-waiting-room': ['in-progress', 'cancelled', 'no-show'],
  'in-progress': ['done'],
  done: [], // Terminal state
  cancelled: [], // Terminal state
  'no-show': [], // Terminal state
}

/**
 * Roles that can perform specific status transitions
 */
export const ROLE_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  receptionist: ['confirmed', 'in-waiting-room', 'cancelled', 'no-show', 'done'],
  doctor: ['in-progress', 'done'],
  clinic_admin: ['confirmed', 'in-waiting-room', 'in-progress', 'cancelled', 'no-show', 'done'],
  super_admin: ['confirmed', 'in-waiting-room', 'in-progress', 'cancelled', 'no-show', 'done'],
}

/**
 * Validate if a status transition is allowed
 */
export function isValidTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus]
  return allowedTransitions.includes(nextStatus)
}

/**
 * Validate if a role can perform a specific status transition
 */
export function canRolePerformTransition(
  role: string,
  targetStatus: AppointmentStatus
): boolean {
  const allowedTransitions = ROLE_TRANSITIONS[role] || []
  return allowedTransitions.includes(targetStatus)
}

/**
 * Get all possible next statuses for a given current status
 */
export function getNextStatuses(currentStatus: AppointmentStatus): AppointmentStatus[] {
  return VALID_TRANSITIONS[currentStatus] || []
}

/**
 * Validate a complete status transition (both business rule and role permission)
 */
export function validateStatusTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus,
  role: string
): { valid: boolean; reason?: string } {
  // Check if transition is valid by business rules
  if (!isValidTransition(currentStatus, nextStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from ${currentStatus} to ${nextStatus}`,
    }
  }

  // Check if role has permission
  if (!canRolePerformTransition(role, nextStatus)) {
    return {
      valid: false,
      reason: `Role ${role} is not allowed to set status to ${nextStatus}`,
    }
  }

  return { valid: true }
}
