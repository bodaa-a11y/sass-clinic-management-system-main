import { z } from 'zod';

export const clinicSchema = z.object({
  name: z.string().min(2).max(100, 'Name must be between 2 and 100 characters'),
  slug: z
    .string()
    .min(2)
    .max(50, 'Slug must be between 2 and 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const clinicUpdateSchema = clinicSchema.partial();

export const staffSchema = z.object({
  name: z.string().min(2).max(255, 'Name must be between 2 and 255 characters'),
  role: z.enum(['doctor', 'receptionist']),
  specialty: z.string().optional(),
});

export const staffUpdateSchema = staffSchema.partial();

export const patientSchema = z.object({
  fullName: z.string().min(2).max(255, 'Full name must be between 2 and 255 characters'),
  phone: z.string().min(5).max(20, 'Phone must be between 5 and 20 characters'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
});

export const appointmentSchema = z.object({
  doctorId: z.string().uuid('Doctor ID must be a valid UUID'),
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  notes: z.string().optional(),
  priority: z.enum(['normal', 'priority', 'emergency']).default('normal'),
  // Recurring appointment fields
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringCount: z.number().int().min(1).max(52).optional(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in-waiting-room', 'in-progress', 'done', 'no-show', 'cancelled']),
});

export const availabilitySlotSchema = z.object({
  doctorId: z.string().uuid('Doctor ID must be a valid UUID'),
  dayOfWeek: z.coerce.number().int().min(0).max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
  slotDurationMinutes: z.coerce.number().int().refine((val) => [15, 20, 30, 60].includes(val), {
    message: 'Slot duration must be 15, 20, 30, or 60 minutes',
  }),
  bufferAfterMinutes: z.coerce.number().int().min(0).max(120).default(0),
});

export const medicalRecordSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
  doctorId: z.string().uuid('Doctor ID must be a valid UUID'),
  appointmentId: z.string().uuid('Appointment ID must be a valid UUID').optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Visit date must be in YYYY-MM-DD format').optional(),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  symptoms: z.string().optional(),
  clinicalNotes: z.string().optional(),
  vitalSigns: z.string().optional(),
  treatmentPlan: z.string().min(1, 'Treatment plan is required'),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Follow-up date must be in YYYY-MM-DD format').optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
  doctorId: z.string().uuid('Doctor ID must be a valid UUID'),
  medicalRecordId: z.string().uuid('Medical record ID must be a valid UUID'),
  prescriptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Prescription date must be in YYYY-MM-DD format').optional(),
  medications: z.string().min(1, 'Medications are required'),
  instructions: z.string().min(1, 'Instructions are required'),
  status: z.enum(['active', 'completed']).default('active'),
  medicationName: z.string().min(1, 'Medication name is required').optional(),
  dosage: z.string().min(1, 'Dosage is required').optional(),
  frequency: z.string().min(1, 'Frequency is required').optional(),
  duration: z.string().min(1, 'Duration is required').optional(),
});

export const invoiceSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
  appointmentId: z.string().uuid('Appointment ID must be a valid UUID').optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional(),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Subtotal must be a valid decimal number'),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Tax amount must be a valid decimal number').default('0'),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Discount amount must be a valid decimal number').default('0'),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Total amount must be a valid decimal number'),
  paymentMethod: z.enum(['cash', 'card', 'insurance', 'bank_transfer', 'online']).optional(),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid('Invoice ID must be a valid UUID'),
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal number'),
  paymentMethod: z.enum(['cash', 'card', 'insurance', 'bank_transfer', 'online']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const scheduleExceptionSchema = z.object({
  doctorId: z.string().uuid('Doctor ID must be a valid UUID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  exceptionType: z.enum(['vacation', 'sick_leave', 'personal', 'conference', 'other']),
  reason: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export type StaffInput = z.infer<typeof staffSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
