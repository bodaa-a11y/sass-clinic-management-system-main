import { db } from '@/db';
import { medicalDocuments, radiologyImages, labResults } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id: clinicId, documentId } = await params;
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical_documents', 'PATCH');
    if (!tenantCheck.success) return tenantCheck.response!;

    // Only doctors and receptionists can approve documents
    const userRole = tenantCheck.context?.userRole;
    if (userRole !== 'doctor' && userRole !== 'receptionist' && userRole !== 'clinic_admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve documents' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, rejectionReason, documentType } = body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    let updatedDocument: any;

    // Update based on document type
    if (documentType && ['x-ray', 'mri', 'ct-scan', 'ultrasound'].includes(documentType)) {
      const [doc] = await db
        .update(radiologyImages)
        .set({
          status,
          verifiedBy: tenantCheck.context?.userId,
          verifiedAt: new Date(),
          rejectionReason: status === 'rejected' ? rejectionReason : null,
        })
        .where(eq(radiologyImages.id, documentId))
        .returning();
      updatedDocument = doc;
    } else if (documentType === 'lab-result') {
      const [doc] = await db
        .update(labResults)
        .set({
          status: status === 'verified' ? 'completed' : 'cancelled',
          verifiedBy: tenantCheck.context?.userId,
          verifiedAt: new Date(),
          rejectionReason: status === 'rejected' ? rejectionReason : null,
        })
        .where(eq(labResults.id, documentId))
        .returning();
      updatedDocument = doc;
    } else {
      const [doc] = await db
        .update(medicalDocuments)
        .set({
          status,
          verifiedBy: tenantCheck.context?.userId,
          verifiedAt: new Date(),
          rejectionReason: status === 'rejected' ? rejectionReason : null,
        })
        .where(eq(medicalDocuments.id, documentId))
        .returning();
      updatedDocument = doc;
    }

    await logAudit({
      action: status === 'verified' ? 'UPDATE_MEDICAL_RECORD' : 'UPDATE_MEDICAL_RECORD',
      clinicId,
      userId: tenantCheck.context?.userId,
      entityType: documentType === 'lab-result' ? 'lab_result' : documentType && ['x-ray', 'mri', 'ct-scan', 'ultrasound'].includes(documentType) ? 'radiology_image' : 'medical_document',
      entityId: documentId,
      newValues: { status, rejectionReason },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Failed to update document status:', error);
    return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
  }
}
