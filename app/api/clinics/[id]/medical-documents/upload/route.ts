import { v2 as cloudinary } from 'cloudinary';
import { db } from '@/db';
import { medicalDocuments, radiologyImages, labResults } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'medical_documents', 'POST');
    if (!tenantCheck.success) return tenantCheck.response!;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('textContent') as string | null;
    const patientId = formData.get('patientId') as string;
    const documentType = formData.get('documentType') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;

    if (!patientId || !documentType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!file && !textContent) {
      return NextResponse.json(
        { error: 'Either file or text content is required' },
        { status: 400 }
      );
    }

    let document: any;

    // Determine which table to use based on document type
    if (['x-ray', 'mri', 'ct-scan', 'ultrasound'].includes(documentType)) {
      // Save to radiology_images table
      if (file) {
        // Upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: `radiology/${id}/${patientId}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        [document] = await db.insert(radiologyImages).values({
          clinicId: id,
          patientId,
          imageUrl: (result as any).secure_url,
          title,
          type: documentType,
          description: description || undefined,
          uploadedBy: tenantCheck.context?.userId,
          status: 'pending',
        }).returning();
      } else {
        return NextResponse.json(
          { error: 'File is required for radiology images' },
          { status: 400 }
        );
      }

      await logAudit({
        action: 'CREATE_MEDICAL_RECORD',
        clinicId: id,
        userId: tenantCheck.context?.userId,
        entityType: 'radiology_image',
        entityId: document.id,
        newValues: { title, type: documentType, patientId },
      });
    } else if (documentType === 'lab-result') {
      // Save to lab_results table
      if (textContent) {
        [document] = await db.insert(labResults).values({
          clinicId: id,
          patientId,
          doctorId: tenantCheck.context?.userId,
          testName: title,
          testType: 'general',
          result: textContent,
          notes: description || undefined,
          status: 'pending',
        }).returning();
      } else if (file) {
        // Upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: `lab-results/${id}/${patientId}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        [document] = await db.insert(labResults).values({
          clinicId: id,
          patientId,
          doctorId: tenantCheck.context?.userId,
          testName: title,
          testType: 'general',
          result: (result as any).secure_url,
          notes: description || undefined,
          status: 'pending',
        }).returning();
      }

      await logAudit({
        action: 'CREATE_MEDICAL_RECORD',
        clinicId: id,
        userId: tenantCheck.context?.userId,
        entityType: 'lab_result',
        entityId: document.id,
        newValues: { title, patientId },
      });
    } else {
      // Save to medical_documents table
      if (file) {
        // Upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: `medical-documents/${id}/${patientId}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        [document] = await db.insert(medicalDocuments).values({
          clinicId: id,
          patientId,
          documentType,
          title,
          description: description || undefined,
          fileUrl: (result as any).secure_url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: 'pending',
          uploadedBy: tenantCheck.context?.userId,
        }).returning();
      } else if (textContent) {
        [document] = await db.insert(medicalDocuments).values({
          clinicId: id,
          patientId,
          documentType,
          title,
          description: description || undefined,
          fileUrl: '',
          fileName: '',
          fileSize: 0,
          mimeType: 'text/plain',
          status: 'pending',
          uploadedBy: tenantCheck.context?.userId,
          notes: textContent,
        }).returning();
      }

      await logAudit({
        action: 'CREATE_MEDICAL_RECORD',
        clinicId: id,
        userId: tenantCheck.context?.userId,
        entityType: 'medical_document',
        entityId: document.id,
        newValues: { title, documentType, patientId },
      });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Failed to upload medical document:', error);
    return NextResponse.json({ error: 'Failed to upload medical document' }, { status: 500 });
  }
}
