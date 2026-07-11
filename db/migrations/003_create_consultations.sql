-- Migration 003: Create consultations table
-- This migration creates the consultations table as the parent entity for clinical examinations
-- with JSONB-based configurable clinical data support

-- Step 1: Create consultation_status enum
CREATE TYPE consultation_status AS ENUM (
  'arrived',
  'in-progress',
  'completed',
  'cancelled'
);

-- Step 2: Create consultations table
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Session lifecycle
  status consultation_status NOT NULL DEFAULT 'arrived',
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Core clinical data (outside JSONB for indexing/search)
  chief_complaint TEXT,
  diagnosis TEXT,
  
  -- Configurable clinical data (JSONB)
  clinical_data JSONB NOT NULL DEFAULT '{"vitals":{},"specialtyData":{},"sectionsProgress":{}}',
  
  -- Metadata
  notes TEXT,
  follow_up_date DATE,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add indexes for performance
-- Index for tenant isolation
CREATE INDEX idx_consultations_clinic_id ON consultations(clinic_id);
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX idx_consultations_appointment_id ON consultations(appointment_id);

-- Index for status filtering
CREATE INDEX idx_consultations_status ON consultations(status);

-- Index for date range queries
CREATE INDEX idx_consultations_start_time ON consultations(start_time DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_consultations_clinical_data ON consultations USING GIN(clinical_data);

-- Index for diagnosis search (outside JSONB for performance)
CREATE INDEX idx_consultations_diagnosis ON consultations(diagnosis) WHERE diagnosis IS NOT NULL;

-- Composite index for active consultations by clinic
CREATE INDEX idx_consultations_clinic_active ON consultations(clinic_id, status) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Step 4: Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_consultations_updated_at();

-- Step 5: Add comments for documentation
COMMENT ON TABLE consultations IS 'Parent entity for clinical examination sessions';
COMMENT ON COLUMN consultations.status IS 'Session status: arrived, in-progress, completed, cancelled';
COMMENT ON COLUMN consultations.clinical_data IS 'JSONB field containing vitals, specialty data, and section progress';
COMMENT ON COLUMN consultations.chief_complaint IS 'Patient chief complaint (outside JSONB for indexing)';
COMMENT ON COLUMN consultations.diagnosis IS 'Doctor diagnosis (outside JSONB for indexing)';

-- Step 6: Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON consultations TO neondb_owner;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON consultations TO clinic_users;
-- GRANT USAGE, SELECT ON SEQUENCE consultations_id_seq TO clinic_users;
