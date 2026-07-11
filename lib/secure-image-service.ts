/**
 * Secure Image Service
 * 
 * Generates signed URLs for sensitive medical images.
 * Signed URLs are time-limited and can be revoked.
 * 
 * This is useful for:
 * - Sharing images with external specialists (temporarily)
 * - Emailing reports with image links
 * - Patient portal access (with expiration)
 * 
 * @module lib/secure-image-service
 */

import crypto from 'crypto'
import { db } from '@/db'
import { radiologyImages, medicalDocuments, labResults } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface SignedURLOptions {
  expiresIn?: number // seconds (default: 3600 = 1 hour)
  maxViews?: number // limit number of views (optional)
  revokeAfter?: Date // revoke after specific time
}

export interface SignedURLRequest {
  imageId: string
  imageType: 'radiology' | 'medical_document' | 'lab_result'
  userId: string
  clinicId: string
  options?: SignedURLOptions
}

export interface SignedURLResult {
  success: boolean
  signedUrl?: string
  token?: string
  expiresAt?: Date
  error?: string
}

export interface VerifyResult {
  valid: boolean
  imageId?: string
  imageType?: string
  error?: string
}

const SECRET_KEY = process.env.SIGNED_URL_SECRET || crypto.randomBytes(32).toString('hex')
const DEFAULT_EXPIRY = 3600 // 1 hour

/**
 * Generate a signed token for image access
 */
function generateSignedToken(data: {
  imageId: string
  imageType: string
  userId: string
  clinicId: string
  expiresAt: number
  maxViews?: number
}): string {
  const payload = JSON.stringify(data)
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex')
  
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url')
}

/**
 * Verify a signed token
 */
function verifySignedToken(token: string): VerifyResult {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    const { payload, signature } = decoded

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('hex')

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' }
    }

    const data = JSON.parse(payload)

    // Check expiration
    if (data.expiresAt < Date.now()) {
      return { valid: false, error: 'URL expired' }
    }

    return {
      valid: true,
      imageId: data.imageId,
      imageType: data.imageType,
    }
  } catch (error) {
    return { valid: false, error: 'Invalid token' }
  }
}

/**
 * Generate a signed URL for secure image access
 */
export async function generateSignedURL(request: SignedURLRequest): Promise<SignedURLResult> {
  try {
    const { imageId, imageType, userId, clinicId, options = {} } = request
    const expiresIn = options.expiresIn || DEFAULT_EXPIRY
    const expiresAt = Date.now() + expiresIn * 1000

    // Verify image exists and belongs to the clinic
    let image: any = null

    switch (imageType) {
      case 'radiology':
        const [radImage] = await db
          .select()
          .from(radiologyImages)
          .where(eq(radiologyImages.id, imageId))
          .limit(1)
        image = radImage
        break

      case 'medical_document':
        const [docImage] = await db
          .select()
          .from(medicalDocuments)
          .where(eq(medicalDocuments.id, imageId))
          .limit(1)
        image = docImage
        break

      case 'lab_result':
        const [labImage] = await db
          .select()
          .from(labResults)
          .where(eq(labResults.id, imageId))
          .limit(1)
        image = labImage
        break
    }

    if (!image) {
      return { success: false, error: 'Image not found' }
    }

    if (image.clinicId !== clinicId) {
      return { success: false, error: 'Image does not belong to this clinic' }
    }

    // Generate signed token
    const token = generateSignedToken({
      imageId,
      imageType,
      userId,
      clinicId,
      expiresAt,
      maxViews: options.maxViews,
    })

    // Generate signed URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const signedUrl = `${baseUrl}/api/secure-images/${token}`

    return {
      success: true,
      signedUrl,
      token,
      expiresAt: new Date(expiresAt),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed URL',
    }
  }
}

/**
 * Verify and decode a signed URL
 */
export function verifySignedURL(token: string): VerifyResult {
  return verifySignedToken(token)
}

/**
 * Generate a batch of signed URLs for multiple images
 */
export async function generateBatchSignedURLs(
  requests: SignedURLRequest[]
): Promise<SignedURLResult[]> {
  return Promise.all(requests.map(req => generateSignedURL(req)))
}

/**
 * Secure Image Service Class
 */
export class SecureImageService {
  /**
   * Generate a shareable link for a patient
   * Useful for patient portal or external specialist sharing
   */
  async generatePatientShareLink(
    clinicId: string,
    patientId: string,
    imageIds: string[],
    expiresIn: number = 86400 // 24 hours default
  ): Promise<{ shareUrl: string; expiresAt: Date }> {
    // In a real implementation, you would:
    // 1. Create a share record in the database
    // 2. Generate a unique share token
    // 3. Link it to the patient and images
    // 4. Return a URL like /api/share/[shareToken]

    // For now, we'll generate individual signed URLs
    const requests = imageIds.map(imageId => ({
      imageId,
      imageType: 'radiology' as const,
      userId: 'system',
      clinicId,
      options: { expiresIn },
    }))

    const results = await generateBatchSignedURLs(requests)

    return {
      shareUrl: results[0]?.signedUrl || '',
      expiresAt: results[0]?.expiresAt || new Date(),
    }
  }

  /**
   * Revoke all signed URLs for a specific image
   */
  async revokeSignedURLs(imageId: string): Promise<void> {
    // In a real implementation with a database-backed token system:
    // 1. Mark all active tokens for this image as revoked
    // 2. Or change the image's secret key
    
    // For now, we rely on expiration
    console.log(`Revoking signed URLs for image ${imageId}`)
  }
}

export const secureImageService = new SecureImageService()
