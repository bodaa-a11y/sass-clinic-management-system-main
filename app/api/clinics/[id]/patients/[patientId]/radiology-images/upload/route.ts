import cloudinary from '@/lib/cloudinary';
import { db } from '@/db';
import { radiologyImages } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    const { id, patientId } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'radiology_images', 'POST');
    if (!tenantCheck.success) return tenantCheck.response!;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve: any, reject: any) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `clinics/${id}/radiology/${patientId}`,
          resource_type: 'image',
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Save to database
    const [image] = await db.insert(radiologyImages).values({
      clinicId: id,
      patientId,
      imageUrl: (result as any).secure_url,
      title,
      type,
      description,
      uploadedBy: tenantCheck.context?.userId,
    }).returning();

    await logAudit({
      action: 'CREATE_MEDICAL_RECORD',
      clinicId: id,
      userId: tenantCheck.context?.userId,
      entityType: 'radiology_image',
      entityId: image.id,
      newValues: { title, type },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Failed to upload image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
