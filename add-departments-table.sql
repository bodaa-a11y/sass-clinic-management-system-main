-- Migration: Add departments table
-- Description: Add departments table for medical centers

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  head_of_department VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_departments_clinic_id ON departments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_deleted_at ON departments(deleted_at);

-- Add RLS (Row Level Security)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policy: Clinic users can view their departments
CREATE POLICY "Clinic users can view departments" ON departments
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Clinic admins can create departments
CREATE POLICY "Clinic admins can create departments" ON departments
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid() AND role = 'clinic_admin'
    )
  );

-- Policy: Clinic admins can update departments
CREATE POLICY "Clinic admins can update departments" ON departments
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid() AND role = 'clinic_admin'
    )
  );

-- Policy: Clinic admins can delete departments
CREATE POLICY "Clinic admins can delete departments" ON departments
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid() AND role = 'clinic_admin'
    )
  );
