import { db } from '@/db';
import { medicalDocuments, radiologyImages, labResults, patients } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { eq, and, isNull, desc, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'medical_documents', 'GET');
    if (!tenantCheck.success) return tenantCheck.response!;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    // Fetch from all three tables
    const [medicalDocs, radiologyDocs, labDocs] = await Promise.all([
      db.query.medicalDocuments.findMany({
        where: and(
          eq(medicalDocuments.clinicId, id),
          patientId ? eq(medicalDocuments.patientId, patientId) : undefined,
          status ? eq(medicalDocuments.status, status as any) : undefined,
          isNull(medicalDocuments.deletedAt)
        ),
        orderBy: [desc(medicalDocuments.createdAt)],
      }),
      db.query.radiologyImages.findMany({
        where: and(
          eq(radiologyImages.clinicId, id),
          patientId ? eq(radiologyImages.patientId, patientId) : undefined,
          status ? eq(radiologyImages.status, status as any) : undefined,
          isNull(radiologyImages.deletedAt)
        ),
        orderBy: [desc(radiologyImages.createdAt)],
      }),
      db.query.labResults.findMany({
        where: and(
          eq(labResults.clinicId, id),
          patientId ? eq(labResults.patientId, patientId) : undefined,
          status ? eq(labResults.status, status as any) : undefined,
          isNull(labResults.deletedAt)
        ),
        orderBy: [desc(labResults.createdAt)],
      }),
    ]);

    // Normalize to unified format
    const allDocuments = [
      ...medicalDocs.map(doc => ({
        ...doc,
        documentType: doc.documentType,
        unifiedType: 'medical_document',
        url: doc.fileUrl,
        title: doc.title,
      })),
      ...radiologyDocs.map(doc => ({
        ...doc,
        documentType: doc.type,
        unifiedType: 'radiology_image',
        url: doc.imageUrl,
        title: doc.title,
      })),
      ...labDocs.map(doc => ({
        ...doc,
        documentType: 'lab-result',
        unifiedType: 'lab_result',
        url: typeof doc.result === 'string' ? doc.result : undefined,
        title: doc.testName,
      })),
    ].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Fetch patient names
    const patientIds = [...new Set(allDocuments.map(doc => doc.patientId))];
    const patientsList = patientIds.length > 0
      ? await db.query.patients.findMany({
          where: inArray(patients.id, patientIds),
        })
      : [];

    // Add patientName to each document
    const documentsWithPatientName = allDocuments.map(doc => {
      const patient = patientsList.find(p => p.id === doc.patientId);
      return {
        ...doc,
        patientName: patient?.fullName || 'غير معروف',
      };
    });

    return NextResponse.json(documentsWithPatientName);
  } catch (error) {
    console.error('Failed to fetch medical documents:', error);
    return NextResponse.json({ error: 'Failed to fetch medical documents' }, { status: 500 });
  }
}
