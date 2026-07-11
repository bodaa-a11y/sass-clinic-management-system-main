-- Add Patient Portal Tables
-- This migration adds all tables required for the Patient Portal feature

-- Create message_priority_enum
CREATE TYPE IF NOT EXISTS message_priority_enum AS ENUM ('normal', 'urgent');

-- Create notification_type_enum
CREATE TYPE IF NOT EXISTS notification_type_enum AS ENUM (
  'appointment',
  'lab_result',
  'message',
  'invoice',
  'reminder',
  'prescription'
);

-- Create refill_request_status_enum
CREATE TYPE IF NOT EXISTS refill_request_status_enum AS ENUM ('pending', 'approved', 'rejected');

-- Create patient_portal_accounts table
CREATE TABLE IF NOT EXISTS patient_portal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  recovery_codes JSONB DEFAULT '[]',
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create patient_sessions table
CREATE TABLE IF NOT EXISTS patient_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_account_id UUID NOT NULL REFERENCES patient_portal_accounts(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create patient_messages table
CREATE TABLE IF NOT EXISTS patient_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type VARCHAR(20) NOT NULL,
  recipient_id UUID,
  recipient_type VARCHAR(20) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  priority message_priority_enum DEFAULT 'normal',
  attachments JSONB DEFAULT '[]',
  parent_id UUID REFERENCES patient_messages(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create patient_notifications table
CREATE TABLE IF NOT EXISTS patient_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create patient_preferences table
CREATE TABLE IF NOT EXISTS patient_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE UNIQUE,
  language VARCHAR(10) DEFAULT 'ar',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  appointment_reminders BOOLEAN DEFAULT true,
  lab_result_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  invoice_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create patient_audit_log table
CREATE TABLE IF NOT EXISTS patient_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create prescription_refill_requests table
CREATE TABLE IF NOT EXISTS prescription_refill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  pharmacy_id VARCHAR(255),
  pharmacy_name VARCHAR(255),
  status refill_request_status_enum DEFAULT 'pending',
  notes TEXT,
  rejection_reason TEXT,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_portal_accounts_patient_id ON patient_portal_accounts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_portal_accounts_email ON patient_portal_accounts(email);
CREATE INDEX IF NOT EXISTS idx_patient_sessions_patient_account_id ON patient_sessions(patient_account_id);
CREATE INDEX IF NOT EXISTS idx_patient_sessions_token ON patient_sessions(token);
CREATE INDEX IF NOT EXISTS idx_patient_sessions_expires_at ON patient_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_patient_messages_patient_id ON patient_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_sender_id ON patient_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_recipient_id ON patient_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_parent_id ON patient_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_patient_id ON patient_notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_type ON patient_notifications(type);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_is_read ON patient_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_patient_preferences_patient_id ON patient_preferences(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_audit_log_patient_id ON patient_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_audit_log_created_at ON patient_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_prescription_refill_requests_patient_id ON prescription_refill_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_refill_requests_prescription_id ON prescription_refill_requests(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_refill_requests_status ON prescription_refill_requests(status);

-- Add comments for documentation
COMMENT ON TABLE patient_portal_accounts IS 'Stores patient portal account information for login and authentication';
COMMENT ON TABLE patient_sessions IS 'Stores active patient sessions for authentication';
COMMENT ON TABLE patient_messages IS 'Stores secure messages between patients and healthcare providers';
COMMENT ON TABLE patient_notifications IS 'Stores notifications sent to patients';
COMMENT ON TABLE patient_preferences IS 'Stores patient preferences for the portal';
COMMENT ON TABLE patient_audit_log IS 'Stores audit logs for patient actions (HIPAA compliance)';
COMMENT ON TABLE prescription_refill_requests IS 'Stores prescription refill requests from patients';
