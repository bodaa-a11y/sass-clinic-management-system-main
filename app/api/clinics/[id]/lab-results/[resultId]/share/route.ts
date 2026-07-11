import { db } from '@/db';
import { labResults } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { id, resultId } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'lab_results', 'POST');
    if (!tenantCheck.success) return tenantCheck.response!;

    const [result] = await db.update(labResults)
      .set({
        sharedWithPatient: true,
        sharedDate: new Date(),
      })
      .where(and(
        eq(labResults.id, resultId),
        eq(labResults.clinicId, id)
      ))
      .returning();

    if (!result) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    await logAudit({
      action: 'lab_result.shared',
      clinicId: id,
      userId: tenantCheck.context?.userId,
      resourceId: resultId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to share lab result:', error);
    return NextResponse.json({ error: 'Failed to share lab result' }, { status: 500 });
  }
}
