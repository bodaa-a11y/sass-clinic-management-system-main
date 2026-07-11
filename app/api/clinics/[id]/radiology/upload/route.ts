/**
 * Radiology Image Upload API Route
 * 
 * This route demonstrates the complete integration of:
 * 1. Tenant-safe database operations (tenantDb)
 * 2. Transactional media uploads (mediaService)
 * 3. Automatic tenant context injection (withTenantContext)
 * 
 * @route POST /api/clinics/[id]/radiology/upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/tenant-middleware'
import { mediaService } from '@/lib/media-service'
import { tenantDb } from '@/lib/db-tenant-aware'
import { radiologyImages } from '@/db/schema'
import { isNull } from 'drizzle-orm'
import { logAudit } from '@/lib/audit'

/**
 * POST /api/clinics/[id]/radiology/upload
 * 
 * Upload a radiology image with full tenant safety and transactional integrity
 * 
 * Request body (multipart/form-data):
 * - file: File (required)
 * - imagingType: string (required) - X-Ray, MRI, CT Scan, Ultrasound
 * - imagingDate: string (ISO date, required)
 * - description: string (optional)
 * 
 * Headers:
 * - x-user-id: string (required)
 * - x-user-role: string (required)
 * - x-user-email: string (optional)
 */
export const POST = withTenantContext(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: clinicId } = await params
    
    // Step 1: Parse FormData
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const imagingType = formData.get('imagingType') as string
    const imagingDateStr = formData.get('imagingDate') as string
    const description = formData.get('description') as string | null

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'File is required', code: 'MISSING_FILE' },
        { status: 400 }
      )
    }

    if (!imagingType) {
      return NextResponse.json(
        { error: 'Imaging type is required', code: 'MISSING_IMAGING_TYPE' },
        { status: 400 }
      )
    }

    if (!imagingDateStr) {
      return NextResponse.json(
        { error: 'Imaging date is required', code: 'MISSING_IMAGING_DATE' },
        { status: 400 }
      )
    }

    // Validate imaging type
    const validImagingTypes = ['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Other']
    if (!validImagingTypes.includes(imagingType)) {
      return NextResponse.json(
        { error: `Invalid imaging type. Must be one of: ${validImagingTypes.join(', ')}`, code: 'INVALID_IMAGING_TYPE' },
        { status: 400 }
      )
    }

    // Validate file type (only images allowed)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      )
    }

    // Parse imaging date
    const imagingDate = new Date(imagingDateStr)
    if (isNaN(imagingDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid imaging date format', code: 'INVALID_DATE' },
        { status: 400 }
      )
    }

    // Extract patientId from FormData or from query params
    const patientId = formData.get('patientId') as string || request.nextUrl.searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required', code: 'MISSING_PATIENT_ID' },
        { status: 400 }
      )
    }

    // Step 2: Verify patient belongs to this clinic (using tenantDb)
    // Note: clinicId is automatically injected by tenantDb - we don't pass it manually!
    const patientExists = await tenantDb
      .select(require('@/db/schema').patients)
      .where(
        require('@/db/schema').eq(require('@/db/schema').patients.id, patientId)
      )
      .first()

    if (!patientExists) {
      return NextResponse.json(
        { error: 'Patient not found or does not belong to this clinic', code: 'PATIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Step 3: Upload to Cloudinary via mediaService
    // The mediaService handles:
    // - File to Buffer conversion
    // - Retry logic with exponential backoff
    // - Cloudinary upload
    // - DB record creation
    // - Cleanup on failure
    const uploadResult = await mediaService.uploadRadiologyImage({
      clinicId, // Note: We pass clinicId for folder organization in Cloudinary
      patientId,
      imagingType,
      imagingDate,
      file, // File object from FormData - mediaService handles conversion
      mimeType: file.type,
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed', code: 'UPLOAD_FAILED' },
        { status: 500 }
      )
    }

    // Step 4: Update additional fields using tenantDb
    // Note: clinicId is automatically injected - we don't pass it!
    // This demonstrates that tenantDb can be used for additional updates
    if (description) {
      await tenantDb
        .update(radiologyImages, {
          description,
          updatedAt: new Date(),
        })
        .where(
          require('@/db/schema').eq(radiologyImages.id, uploadResult.documentId!)
        )
    }

    // Step 5: Log audit trail
    await logAudit({
      clinicId,
      userId: request.headers.get('x-user-id')!,
      action: 'radiology_image_uploaded',
      resourceType: 'radiology_image',
      resourceId: uploadResult.documentId!,
      details: {
        imagingType,
        imagingDate: imagingDate.toISOString(),
        fileSize: file.size,
        fileName: file.name,
      },
    })

    // Step 6: Return success response
    return NextResponse.json({
      success: true,
      data: {
        id: uploadResult.documentId,
        cloudinaryId: uploadResult.cloudinaryId,
        cloudinaryUrl: uploadResult.cloudinaryUrl,
        imagingType,
        imagingDate: imagingDate.toISOString(),
        description,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Radiology upload error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
})

/**
 * GET /api/clinics/[id]/radiology/upload
 * 
 * Returns upload instructions and validation rules for the frontend
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({
    endpoint: '/api/clinics/[id]/radiology/upload',
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      file: {
        type: 'File',
        required: true,
        validation: {
          maxSize: '10MB',
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        },
      },
      imagingType: {
        type: 'string',
        required: true,
        validation: {
          allowedValues: ['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Other'],
        },
      },
      imagingDate: {
        type: 'string',
        required: true,
        format: 'ISO 8601 date (YYYY-MM-DD)',
      },
      patientId: {
        type: 'string',
        required: true,
        format: 'UUID',
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 1000,
      },
    },
    headers: {
      'x-user-id': 'required',
      'x-user-role': 'required',
      'x-user-email': 'optional',
    },
    response: {
      success: true,
      data: {
        id: 'UUID',
        cloudinaryId: 'string',
        cloudinaryUrl: 'string',
        imagingType: 'string',
        imagingDate: 'ISO 8601 datetime',
        description: 'string | null',
        createdAt: 'ISO 8601 datetime',
      },
    },
  })
}

/**
 * Example usage from frontend:
 * 
 * const formData = new FormData()
 * formData.append('file', fileInput.files[0])
 * formData.append('imagingType', 'X-Ray')
 * formData.append('imagingDate', '2024-04-22')
 * formData.append('patientId', 'patient-uuid')
 * formData.append('description', 'Chest X-Ray for routine checkup')
 * 
 * const response = await fetch('/api/clinics/clinic-uuid/radiology/upload', {
 *   method: 'POST',
 *   headers: {
 *     'x-user-id': user.id,
 *     'x-user-role': user.role,
 *   },
 *   body: formData,
 * })
 * 
 * const result = await response.json()
 * if (result.success) {
 *   console.log('Upload successful:', result.data.cloudinaryUrl)
 * }
 */
