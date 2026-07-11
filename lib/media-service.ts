/**
 * Media Transactional Service
 * 
 * This service handles media uploads/deletes with transactional integrity.
 * It ensures consistency between Cloudinary and the database with retry logic.
 * Supports File objects from Next.js FormData.
 * 
 * @module lib/media-service
 */

import { db } from '@/db'
import { medicalDocuments, labResults, radiologyImages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export interface UploadResult {
  success: boolean
  documentId?: string
  cloudinaryId?: string
  cloudinaryUrl?: string
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

export interface CleanupResult {
  cleaned: number
  errors: number
}

interface RetryConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Convert File to Buffer for Cloudinary upload
 */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )

      console.warn(`Operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms...`, error)
      await sleep(delay)
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Main Media Service Class
 */
class MediaService {
  /**
   * Upload medical document with transactional integrity
   * Uploads to Cloudinary first, then creates DB record
   */
  async uploadMedicalDocument(
    data: {
      clinicId: string
      patientId: string
      documentName: string
      documentType: string
      file: File | Buffer
      mimeType?: string
    }
  ): Promise<UploadResult> {
    let cloudinaryResult: any = null

    try {
      // Convert File to Buffer if needed
      const fileBuffer = data.file instanceof File ? await fileToBuffer(data.file) : data.file
      const fileName = data.file instanceof File ? data.file.name : `document_${Date.now()}`

      // Step 1: Upload to Cloudinary with retry logic
      cloudinaryResult = await retryWithBackoff(async () => {
        return await cloudinary.uploader.upload(fileBuffer, {
          folder: `clinics/${data.clinicId}/patients/${data.patientId}/documents`,
          resource_type: 'auto',
          public_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 2000, crop: 'limit' }
          ],
          overwrite: false,
        })
      })

      // Step 2: Create DB record with both fileUrl and cloudinary fields
      const [record] = await db
        .insert(medicalDocuments)
        .values({
          clinicId: data.clinicId,
          patientId: data.patientId,
          title: data.documentName,
          documentType: data.documentType,
          fileUrl: cloudinaryResult.secure_url, // Legacy field for backward compatibility
          fileName: fileName,
          fileSize: cloudinaryResult.bytes,
          mimeType: data.mimeType || cloudinaryResult.resource_type,
          cloudinaryId: cloudinaryResult.public_id, // Server-side ID for Cloudinary operations
          cloudinaryUrl: cloudinaryResult.secure_url, // Full URL for frontend display
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      return {
        success: true,
        documentId: record.id,
        cloudinaryId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,
      }
    } catch (error) {
      // Cleanup: Delete uploaded file if DB insert failed
      if (cloudinaryResult) {
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id)
          console.log('Cleaned up orphan file after DB insert failure:', cloudinaryResult.public_id)
        } catch (cleanupError) {
          console.error('Failed to cleanup orphan file:', cleanupError)
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Upload lab result with transactional integrity
   */
  async uploadLabResult(
    data: {
      clinicId: string
      patientId: string
      testName: string
      testType: string
      testDate: Date
      file?: File | Buffer
      resultText?: string
      mimeType?: string
    }
  ): Promise<UploadResult> {
    let cloudinaryResult: any = null

    try {
      let fileUrl: string | null = null
      let fileName: string | null = null
      let fileSize: number | null = null

      // Upload file if provided
      if (data.file) {
        const fileBuffer = data.file instanceof File ? await fileToBuffer(data.file) : data.file
        fileName = data.file instanceof File ? data.file.name : `lab_result_${Date.now()}`

        cloudinaryResult = await retryWithBackoff(async () => {
          return await cloudinary.uploader.upload(fileBuffer, {
            folder: `clinics/${data.clinicId}/patients/${data.patientId}/lab-results`,
            resource_type: 'auto',
            public_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
              { width: 2000, crop: 'limit' }
            ],
            overwrite: false,
          })
        })

        fileUrl = cloudinaryResult.secure_url
        fileSize = cloudinaryResult.bytes
      }

      // Step 2: Create DB record
      const insertData: any = {
        clinicId: data.clinicId,
        patientId: data.patientId,
        testName: data.testName,
        testType: data.testType,
        result: data.resultText || '',
        testDate: data.testDate,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Add file-related fields if file was uploaded
      if (cloudinaryResult) {
        insertData.cloudinaryId = cloudinaryResult.public_id
        insertData.cloudinaryUrl = cloudinaryResult.secure_url
        insertData.fileName = fileName
        insertData.fileSize = fileSize
        insertData.mimeType = data.mimeType || cloudinaryResult.resource_type
      }

      const [record] = await db.insert(labResults).values(insertData).returning()

      return {
        success: true,
        documentId: record.id,
        cloudinaryId: cloudinaryResult?.public_id,
        cloudinaryUrl: cloudinaryResult?.secure_url,
      }
    } catch (error) {
      // Cleanup: Delete uploaded file if DB insert failed
      if (cloudinaryResult) {
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id)
          console.log('Cleaned up orphan file after DB insert failure:', cloudinaryResult.public_id)
        } catch (cleanupError) {
          console.error('Failed to cleanup orphan file:', cleanupError)
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Upload radiology image with transactional integrity
   */
  async uploadRadiologyImage(
    data: {
      clinicId: string
      patientId: string
      imagingType: string
      imagingDate: Date
      file: File | Buffer
      mimeType?: string
    }
  ): Promise<UploadResult> {
    let cloudinaryResult: any = null

    try {
      // Convert File to Buffer if needed
      const fileBuffer = data.file instanceof File ? await fileToBuffer(data.file) : data.file
      const fileName = data.file instanceof File ? data.file.name : `radiology_${Date.now()}`

      // Step 1: Upload to Cloudinary with retry logic
      cloudinaryResult = await retryWithBackoff(async () => {
        return await cloudinary.uploader.upload(fileBuffer, {
          folder: `clinics/${data.clinicId}/patients/${data.patientId}/radiology`,
          resource_type: 'image',
          public_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 2000, crop: 'limit' }
          ],
          overwrite: false,
        })
      })

      // Step 2: Create DB record with both imageUrl and cloudinary fields
      const [record] = await db
        .insert(radiologyImages)
        .values({
          clinicId: data.clinicId,
          patientId: data.patientId,
          imageUrl: cloudinaryResult.secure_url, // Legacy field for backward compatibility
          title: `${data.imagingType} - ${new Date(data.imagingDate).toLocaleDateString()}`,
          type: data.imagingType,
          studyDate: data.imagingDate,
          cloudinaryId: cloudinaryResult.public_id, // Server-side ID for Cloudinary operations
          cloudinaryUrl: cloudinaryResult.secure_url, // Full URL for frontend display
          status: 'pending',
          createdAt: new Date(),
        })
        .returning()

      return {
        success: true,
        documentId: record.id,
        cloudinaryId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,
      }
    } catch (error) {
      // Cleanup: Delete uploaded file if DB insert failed
      if (cloudinaryResult) {
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id)
          console.log('Cleaned up orphan file after DB insert failure:', cloudinaryResult.public_id)
        } catch (cleanupError) {
          console.error('Failed to cleanup orphan file:', cleanupError)
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Delete medical document with transactional integrity
   * Deletes from Cloudinary first, then from DB
   */
  async deleteMedicalDocument(documentId: string): Promise<DeleteResult> {
    try {
      // Step 1: Get cloudinary_id from DB
      const [record] = await db
        .select({ cloudinaryId: medicalDocuments.cloudinaryId })
        .from(medicalDocuments)
        .where(eq(medicalDocuments.id, documentId))
        .limit(1)

      if (!record) {
        return { success: false, error: 'Document not found' }
      }

      const cloudinaryId = record.cloudinaryId

      // Step 2: Delete from Cloudinary with retry logic (if cloudinaryId exists)
      if (cloudinaryId) {
        await retryWithBackoff(async () => {
          const result = await cloudinary.uploader.destroy(cloudinaryId)
          if (result.result !== 'ok' && result.result !== 'not found') {
            throw new Error(`Cloudinary delete failed: ${result.result}`)
          }
          return result
        })
      }

      // Step 3: Delete from DB
      await db.delete(medicalDocuments).where(eq(medicalDocuments.id, documentId))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  /**
   * Delete lab result with transactional integrity
   */
  async deleteLabResult(resultId: string): Promise<DeleteResult> {
    try {
      // Step 1: Get cloudinary_id from DB
      const [record] = await db
        .select({ cloudinaryId: labResults.cloudinaryId })
        .from(labResults)
        .where(eq(labResults.id, resultId))
        .limit(1)

      if (!record) {
        return { success: false, error: 'Lab result not found' }
      }

      const cloudinaryId = record.cloudinaryId

      // Step 2: Delete from Cloudinary with retry logic (if cloudinaryId exists)
      if (cloudinaryId) {
        await retryWithBackoff(async () => {
          const result = await cloudinary.uploader.destroy(cloudinaryId)
          if (result.result !== 'ok' && result.result !== 'not found') {
            throw new Error(`Cloudinary delete failed: ${result.result}`)
          }
          return result
        })
      }

      // Step 3: Delete from DB
      await db.delete(labResults).where(eq(labResults.id, resultId))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  /**
   * Delete radiology image with transactional integrity
   */
  async deleteRadiologyImage(imageId: string): Promise<DeleteResult> {
    try {
      // Step 1: Get cloudinary_id from DB
      const [record] = await db
        .select({ cloudinaryId: radiologyImages.cloudinaryId })
        .from(radiologyImages)
        .where(eq(radiologyImages.id, imageId))
        .limit(1)

      if (!record) {
        return { success: false, error: 'Radiology image not found' }
      }

      const cloudinaryId = record.cloudinaryId

      // Step 2: Delete from Cloudinary with retry logic (if cloudinaryId exists)
      if (cloudinaryId) {
        await retryWithBackoff(async () => {
          const result = await cloudinary.uploader.destroy(cloudinaryId)
          if (result.result !== 'ok' && result.result !== 'not found') {
            throw new Error(`Cloudinary delete failed: ${result.result}`)
          }
          return result
        })
      }

      // Step 3: Delete from DB
      await db.delete(radiologyImages).where(eq(radiologyImages.id, imageId))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  /**
   * Cleanup job for orphan files
   * Finds files in Cloudinary that don't have corresponding DB records
   */
  async cleanupOrphanFiles(clinicId?: string): Promise<CleanupResult> {
    try {
      const prefix = clinicId ? `clinics/${clinicId}` : 'clinics/'
      
      // Get all files in clinic folders from Cloudinary
      const resources = await retryWithBackoff(async () => {
        return await cloudinary.api.resources({
          type: 'upload',
          prefix,
          max_results: 500,
        })
      })

      const cloudinaryIds = resources.resources.map((r: any) => r.public_id)

      // Get all cloudinary_ids from DB
      const medicalDocs = await db
        .select({ cloudinaryId: medicalDocuments.cloudinaryId })
        .from(medicalDocuments)

      const labDocs = await db
        .select({ cloudinaryId: labResults.cloudinaryId })
        .from(labResults)

      const radiologyDocs = await db
        .select({ cloudinaryId: radiologyImages.cloudinaryId })
        .from(radiologyImages)

      const dbIds = [
        ...medicalDocs.map((r: any) => r.cloudinaryId),
        ...labDocs.map((r: any) => r.cloudinaryId),
        ...radiologyDocs.map((r: any) => r.cloudinaryId),
      ].filter(Boolean)

      // Find orphan files (in Cloudinary but not in DB)
      const orphanIds = cloudinaryIds.filter((id: string) => !dbIds.includes(id))

      // Delete orphan files
      let cleaned = 0
      let errors = 0

      for (const id of orphanIds) {
        try {
          await retryWithBackoff(async () => {
            const result = await cloudinary.uploader.destroy(id)
            if (result.result !== 'ok' && result.result !== 'not found') {
              throw new Error(`Cloudinary delete failed: ${result.result}`)
            }
            return result
          })
          cleaned++
        } catch (error) {
          errors++
          console.error(`Failed to delete orphan file ${id}:`, error)
        }
      }

      return { cleaned, errors }
    } catch (error) {
      console.error('Cleanup job failed:', error)
      return { cleaned: 0, errors: 1 }
    }
  }

  /**
   * Batch upload multiple files
   */
  async batchUploadMedicalDocuments(
    files: Array<{
      clinicId: string
      patientId: string
      documentName: string
      documentType: string
      file: File | Buffer
      mimeType?: string
    }>
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    // Upload in parallel with concurrency limit
    const concurrencyLimit = 5
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit)
      const batchResults = await Promise.all(
        batch.map(file => this.uploadMedicalDocument(file))
      )
      results.push(...batchResults)
    }

    return results
  }
}

// Singleton instance
export const mediaService = new MediaService()
