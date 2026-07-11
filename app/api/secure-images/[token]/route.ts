/**
 * Secure Images API Route
 * 
 * Handles signed URL access for sensitive medical images.
 * Verifies token signature and expiration before serving the image.
 * 
 * @route GET /api/secure-images/[token]
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySignedURL } from '@/lib/secure-image-service'
import { db } from '@/db'
import { radiologyImages, medicalDocuments, labResults } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/secure-images/[token]
 * 
 * Verify signed token and redirect to image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Step 1: Verify token
    const verification = verifySignedURL(token)

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 403 }
      )
    }

    const { imageId, imageType } = verification

    if (!imageId || !imageType) {
      return NextResponse.json(
        { error: 'Invalid token data', code: 'INVALID_DATA' },
        { status: 400 }
      )
    }

    // Step 2: Fetch image from DB
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
      return NextResponse.json(
        { error: 'Image not found', code: 'IMAGE_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Step 3: Redirect to image URL
    const imageUrl = image.cloudinaryUrl || image.imageUrl || image.fileUrl

    return NextResponse.redirect(imageUrl, {
      headers: {
        // Cache for 1 hour
        'Cache-Control': 'public, max-age=3600, immutable',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    })

  } catch (error) {
    console.error('Secure image access error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
