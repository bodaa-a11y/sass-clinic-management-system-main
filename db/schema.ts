import { pgTable, uuid, varchar, boolean, timestamp, integer, text, date, pgEnum, decimal, jsonb } from 'drizzle-orm/pg-core';

// CHANGED BY WINDSURF: Added facility_type, edition, enabled_modules, config fields (3 types only)
export const facilityTypeEnum = pgEnum('facility_type', ['single_clinic', 'multi_clinic', 'medical_center']);
export const editionEnum = pgEnum('edition', ['basic', 'pro', 'enterprise']);

export const clinics = pgTable('clinics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  facilityType: facilityTypeEnum('facility_type').default('single_clinic').notNull(),
  edition: editionEnum('edition').default('basic').notNull(),
  enabledModules: jsonb('enabled_modules').default([]).notNull(),
  config: jsonb('config').default({}).notNull(),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 10 }),
  address: text('address'),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  medicalHistory: text('medical_history'),
  allergies: text('allergies'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const availabilitySlots = pgTable('availability_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull(),
  bufferAfterMinutes: integer('buffer_after_minutes').default(0).notNull(),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'in-waiting-room',
  'in-progress',
  'done',
  'no-show',
  'cancelled'
]);

export const appointmentPriorityEnum = pgEnum('appointment_priority', ['normal', 'priority', 'emergency']);

export const consultationStatusEnum = pgEnum('consultation_status', [
  'arrived',
  'in-progress',
  'completed',
  'cancelled'
]);

// Define appointments table without self-reference first
export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  appointmentDate: date('appointment_date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }),
  status: appointmentStatusEnum('status').default('pending').notNull(),
  priority: appointmentPriorityEnum('priority').default('normal').notNull(),
  notes: text('notes'),
  checkInTime: timestamp('check_in_time'),
  startTimeActual: timestamp('start_time_actual'),
  endTimeActual: timestamp('end_time_actual'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  // Recurring appointment fields
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: varchar('recurring_pattern', { length: 20 }), // 'daily', 'weekly', 'monthly'
  recurringCount: integer('recurring_count'), // number of repetitions
  recurringEndDate: date('recurring_end_date'), // calculated end date
  parentAppointmentId: uuid('parent_appointment_id'), // reference to original appointment (will be added via migration)
});

// Consultations (Clinical Examination Sessions)
export const consultations = pgTable('consultations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'restrict' }),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'restrict' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  
  // Session lifecycle
  status: consultationStatusEnum('status').default('arrived').notNull(),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  
  // Core clinical data (outside JSONB for indexing/search)
  chiefComplaint: text('chief_complaint'),
  diagnosis: text('diagnosis'),
  
  // Configurable clinical data (JSONB)
  clinicalData: jsonb('clinical_data').$type<{
    vitals: Record<string, any>;
    specialtyData: Record<string, any>;
    sectionsProgress: Record<string, boolean>;
  }>().default({
    vitals: {},
    specialtyData: {},
    sectionsProgress: {}
  }).notNull(),
  
  // Metadata
  notes: text('notes'),
  followUpDate: date('follow_up_date'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Medical Records (EMR)
export const medicalRecords = pgTable('medical_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  chiefComplaint: text('chief_complaint').notNull(),
  diagnosis: text('diagnosis').notNull(),
  symptoms: text('symptoms'),
  clinicalNotes: text('clinical_notes'),
  vitalSigns: text('vital_signs'), // JSON string for blood pressure, temperature, etc.
  treatmentPlan: text('treatment_plan'),
  followUpDate: date('follow_up_date'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const prescriptionStatusEnum = pgEnum('prescription_status', ['active', 'completed', 'discontinued']);

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  medicalRecordId: uuid('medical_record_id').notNull().references(() => medicalRecords.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  dosage: varchar('dosage', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 100 }).notNull(),
  duration: varchar('duration', { length: 100 }).notNull(),
  instructions: text('instructions'),
  status: prescriptionStatusEnum('status').default('active').notNull(),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Schedule Exceptions (Time Offs)
export const exceptionTypeEnum = pgEnum('exception_type', ['vacation', 'sick_leave', 'personal', 'conference', 'other']);

export const scheduleExceptions = pgTable('schedule_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  exceptionType: exceptionTypeEnum('exception_type').notNull(),
  reason: text('reason'),
  isRecurring: boolean('is_recurring').default(false),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Billing System
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);

export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'insurance', 'bank_transfer', 'online']);

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),
  balanceAmount: decimal('balance_amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  itemType: varchar('item_type', { length: 50 }).notNull(), // consultation, procedure, medication, etc.
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  transactionId: varchar('transaction_id', { length: 255 }),
  paymentDate: timestamp('payment_date').defaultNow(),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userRoleEnum = pgEnum('user_role', ['doctor', 'receptionist', 'clinic_admin', 'super_admin']);

export const userStatusEnum = pgEnum('user_status', ['pending', 'active']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').references(() => clinics.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  specialtyId: uuid('specialty_id').references(() => specialties.id),
  status: userStatusEnum('status').default('pending').notNull(),
  permissions: jsonb('permissions').default('{}'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const planEnum = pgEnum('plan', ['basic', 'pro', 'premium']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'cancelled', 'past_due']);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  plan: planEnum('plan').notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Doctor leaves table
export const doctorLeaves = pgTable('doctor_leaves', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  leaveDate: date('leave_date').notNull(),
  reason: text('reason'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Waitlist status enum
export const waitlistStatusEnum = pgEnum('waitlist_status', ['waiting', 'notified', 'booked']);

// Waitlist table
export const waitlist = pgTable('waitlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  patientPhone: varchar('patient_phone', { length: 20 }).notNull(),
  patientEmail: varchar('patient_email', { length: 255 }),
  preferredDate: date('preferred_date').notNull(),
  status: waitlistStatusEnum('status').default('waiting').notNull(),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Specialties table
export const specialties = pgTable('specialties', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 10 }),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Departments table for medical centers
export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  headOfDepartment: varchar('head_of_department', { length: 255 }),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit Actions Enum
export const auditActionEnum = pgEnum('audit_action', [
  'LOGIN', 'LOGOUT',
  'CREATE_PATIENT', 'UPDATE_PATIENT', 'DELETE_PATIENT',
  'CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'CANCEL_APPOINTMENT',
  'CREATE_MEDICAL_RECORD', 'UPDATE_MEDICAL_RECORD',
  'CREATE_PRESCRIPTION', 'UPDATE_PRESCRIPTION', 'DELETE_PRESCRIPTION',
  'CREATE_INVOICE', 'UPDATE_INVOICE',
  'CREATE_PAYMENT',
  'CREATE_STAFF', 'UPDATE_STAFF', 'DELETE_STAFF',
  'UPDATE_SETTINGS',
  'ADMIN_VIEW_CLINICS',
  'ADMIN_CREATE_CLINIC'
]);

// Audit Logs table for security auditing
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').references(() => clinics.id),
  userId: uuid('user_id').references(() => users.id),
  userRole: varchar('user_role', { length: 50 }),
  action: auditActionEnum('action').notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }),
  oldValues: text('old_values'), // JSON string
  newValues: text('new_values'), // JSON string
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invite tokens for user onboarding
export const inviteTokens = pgTable('invite_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, accepted, expired
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Lab Results
export const labResultStatusEnum = pgEnum('lab_result_status', ['pending', 'completed', 'cancelled']);

export const labResults = pgTable('lab_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  doctorId: uuid('doctor_id').references(() => users.id),
  testName: varchar('test_name', { length: 255 }).notNull(),
  testType: varchar('test_type', { length: 100 }).notNull(),
  result: text('result').notNull(),
  normalRange: varchar('normal_range', { length: 255 }),
  notes: text('notes'),
  status: labResultStatusEnum('status').default('pending').notNull(),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  testDate: timestamp('test_date').defaultNow(),
  sharedDate: timestamp('shared_date'),
  sharedWithPatient: boolean('shared_with_patient').default(false),
  cloudinaryId: varchar('cloudinary_id', { length: 255 }),
  cloudinaryUrl: text('cloudinary_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Radiology Images
export const radiologyImages = pgTable('radiology_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  imageUrl: text('image_url').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // X-Ray, MRI, CT Scan, Ultrasound
  description: text('description'),
  studyDate: timestamp('study_date').defaultNow(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  cloudinaryId: varchar('cloudinary_id', { length: 255 }),
  cloudinaryUrl: text('cloudinary_url'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Medical Documents
export const medicalDocuments = pgTable('medical_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  cloudinaryId: varchar('cloudinary_id', { length: 255 }),
  cloudinaryUrl: text('cloudinary_url'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Lab Integrations
export const labIntegrationTypeEnum = pgEnum('lab_integration_type', ['internal', 'external']);

export const labIntegrations = pgTable('lab_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  labName: varchar('lab_name', { length: 255 }).notNull(),
  labType: labIntegrationTypeEnum('lab_type').notNull(),
  apiEndpoint: text('api_endpoint'),
  apiKey: text('api_key'),
  supportedTests: jsonb('supported_tests').default([]).notNull(),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== PATIENT PORTAL TABLES =====

// Patient Portal Accounts
export const patientPortalAccounts = pgTable('patient_portal_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phoneVerified: boolean('phone_verified').default(false),
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  recoveryCodes: jsonb('recovery_codes').default([]),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Patient Sessions
export const patientSessions = pgTable('patient_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientAccountId: uuid('patient_account_id').notNull().references(() => patientPortalAccounts.id),
  token: varchar('token', { length: 500 }).notNull().unique(),
  deviceInfo: jsonb('device_info').default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Message Priority Enum
export const messagePriorityEnum = pgEnum('message_priority', ['normal', 'urgent']);

// Patient Messages
export const patientMessages = pgTable('patient_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  senderId: uuid('sender_id'),
  senderType: varchar('sender_type', { length: 20 }).notNull(), // 'patient' or 'staff'
  recipientId: uuid('recipient_id'),
  recipientType: varchar('recipient_type', { length: 20 }).notNull(), // 'patient' or 'staff'
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  priority: messagePriorityEnum('priority').default('normal'),
  attachments: jsonb('attachments').default([]),
  parentId: uuid('parent_id').references(() => patientMessages.id), // For threaded messages
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notification Types Enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'appointment',
  'lab_result',
  'message',
  'invoice',
  'reminder',
  'prescription'
]);

// Patient Notifications
export const patientNotifications = pgTable('patient_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  actionUrl: varchar('action_url', { length: 500 }),
  metadata: jsonb('metadata').default({}),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Patient Preferences
export const patientPreferences = pgTable('patient_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id).unique(),
  language: varchar('language', { length: 10 }).default('ar'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Riyadh'),
  emailNotifications: boolean('email_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(true),
  pushNotifications: boolean('push_notifications').default(true),
  appointmentReminders: boolean('appointment_reminders').default(true),
  labResultNotifications: boolean('lab_result_notifications').default(true),
  messageNotifications: boolean('message_notifications').default(true),
  invoiceNotifications: boolean('invoice_notifications').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Patient Audit Log
export const patientAuditLog = pgTable('patient_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Prescription Refill Request Status Enum
export const refillRequestStatusEnum = pgEnum('refill_request_status', ['pending', 'approved', 'rejected']);

// Prescription Refill Requests
export const prescriptionRefillRequests = pgTable('prescription_refill_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  prescriptionId: uuid('prescription_id').notNull().references(() => prescriptions.id),
  pharmacyId: varchar('pharmacy_id', { length: 255 }),
  pharmacyName: varchar('pharmacy_name', { length: 255 }),
  status: refillRequestStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  rejectionReason: text('rejection_reason'),
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export all tables for Drizzle query API
export const schema = {
  users,
  clinics,
  patients,
  availabilitySlots,
  appointments,
  medicalRecords,
  prescriptions,
  radiologyImages,
  labResults,
  labIntegrations,
  medicalDocuments,
  auditLogs,
  inviteTokens,
  labResultStatusEnum,
  labIntegrationTypeEnum,
  // Patient Portal Tables
  patientPortalAccounts,
  patientSessions,
  patientMessages,
  patientNotifications,
  patientPreferences,
  patientAuditLog,
  prescriptionRefillRequests,
  // Patient Portal Enums
  messagePriorityEnum,
  notificationTypeEnum,
  refillRequestStatusEnum,
};
