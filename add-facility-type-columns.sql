-- Add facility_type, edition, enabled_modules, config columns to clinics table
-- Run this manually in your PostgreSQL database

-- Step 1: Create enums
DO $$ BEGIN
    CREATE TYPE facility_type AS ENUM ('single_clinic', 'multi_clinic', 'medical_center');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE edition AS ENUM ('basic', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add columns to clinics table
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS facility_type facility_type DEFAULT 'single_clinic' NOT NULL;

ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS edition edition DEFAULT 'basic' NOT NULL;

ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS enabled_modules jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Step 3: Update existing clinics with default values
UPDATE clinics
SET facility_type = 'single_clinic',
    edition = 'basic',
    enabled_modules = '[]'::jsonb,
    config = '{}'::jsonb
WHERE facility_type IS NULL OR edition IS NULL;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clinics'
  AND column_name IN ('facility_type', 'edition', 'enabled_modules', 'config');
