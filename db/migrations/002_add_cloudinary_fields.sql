-- Migration: Add Cloudinary fields to media tables
-- Description: Add cloudinary_id and cloudinary_url columns for better media management
-- This allows tracking Cloudinary resources separately from display URLs

-- Add cloudinary fields to medical_documents
ALTER TABLE medical_documents 
ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cloudinary_url TEXT;

-- Create index for cloudinary_id on medical_documents
CREATE INDEX IF NOT EXISTS idx_medical_documents_cloudinary_id 
ON medical_documents(cloudinary_id) 
WHERE cloudinary_id IS NOT NULL;

-- Add cloudinary fields to radiology_images
ALTER TABLE radiology_images 
ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cloudinary_url TEXT;

-- Create index for cloudinary_id on radiology_images
CREATE INDEX IF NOT EXISTS idx_radiology_images_cloudinary_id 
ON radiology_images(cloudinary_id) 
WHERE cloudinary_id IS NOT NULL;

-- Add cloudinary fields to lab_results (for future image support)
ALTER TABLE lab_results 
ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cloudinary_url TEXT,
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);

-- Create index for cloudinary_id on lab_results
CREATE INDEX IF NOT EXISTS idx_lab_results_cloudinary_id 
ON lab_results(cloudinary_id) 
WHERE cloudinary_id IS NOT NULL;

-- Backfill existing records with cloudinary data if URL is already present
-- This extracts public_id from existing URLs
UPDATE medical_documents 
SET 
  cloudinary_id = SUBSTRING(file_url FROM 'clinics/[^/]+/[^/]+/[^/]+/([^/]+)'),
  cloudinary_url = file_url
WHERE cloudinary_id IS NULL 
  AND file_url LIKE 'https://res.cloudinary.com/%';

UPDATE radiology_images 
SET 
  cloudinary_id = SUBSTRING(image_url FROM 'clinics/[^/]+/[^/]+/[^/]+/([^/]+)'),
  cloudinary_url = image_url
WHERE cloudinary_id IS NULL 
  AND image_url LIKE 'https://res.cloudinary.com/%';

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN medical_documents.cloudinary_id IS 'Cloudinary public ID for the file resource';
COMMENT ON COLUMN medical_documents.cloudinary_url IS 'Full Cloudinary URL for display purposes';
COMMENT ON COLUMN radiology_images.cloudinary_id IS 'Cloudinary public ID for the image resource';
COMMENT ON COLUMN radiology_images.cloudinary_url IS 'Full Cloudinary URL for display purposes';
COMMENT ON COLUMN lab_results.cloudinary_id IS 'Cloudinary public ID for lab result attachments (future use)';
COMMENT ON COLUMN lab_results.cloudinary_url IS 'Full Cloudinary URL for lab result attachments (future use)';
