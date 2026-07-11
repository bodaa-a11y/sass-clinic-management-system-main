import { db } from '@/db';
import { radiologyImages } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    const { id, patientId } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'radiology_images', 'GET');
    if (!tenantCheck.success) return tenantCheck.response!;

    const images = await db.query.radiologyImages.findMany({
      where: and(
        eq(radiologyImages.clinicId, id),
        eq(radiologyImages.patientId, patientId),
        isNull(radiologyImages.deletedAt)
      ),
      orderBy: (radiologyImages, { desc }) => [desc(radiologyImages.studyDate)],
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch radiology images:', error);
    return NextResponse.json({ error: 'Failed to fetch radiology images' }, { status: 500 });
  }
}
