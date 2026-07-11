-- Create lab_result_status enum
DO $$ BEGIN
    CREATE TYPE lab_result_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    result TEXT NOT NULL,
    normal_range VARCHAR(255),
    notes TEXT,
    status lab_result_status DEFAULT 'pending' NOT NULL,
    test_date TIMESTAMP DEFAULT NOW(),
    shared_date TIMESTAMP,
    shared_with_patient BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create radiology_images table
CREATE TABLE IF NOT EXISTS radiology_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    study_date TIMESTAMP DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create lab_integration_type enum
DO $$ BEGIN
    CREATE TYPE lab_integration_type AS ENUM ('internal', 'external');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create lab_integrations table
CREATE TABLE IF NOT EXISTS lab_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    lab_name VARCHAR(255) NOT NULL,
    lab_type lab_integration_type NOT NULL,
    api_endpoint TEXT,
    api_key TEXT,
    supported_tests JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_results_clinic_id ON lab_results(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON lab_results(status);
CREATE INDEX IF NOT EXISTS idx_lab_results_created_at ON lab_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_radiology_images_clinic_id ON radiology_images(clinic_id);
CREATE INDEX IF NOT EXISTS idx_radiology_images_patient_id ON radiology_images(patient_id);
CREATE INDEX IF NOT EXISTS idx_radiology_images_study_date ON radiology_images(study_date DESC);

CREATE INDEX IF NOT EXISTS idx_lab_integrations_clinic_id ON lab_integrations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_integrations_lab_type ON lab_integrations(lab_type);
