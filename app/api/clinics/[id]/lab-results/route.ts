import { z } from 'zod';
import { db } from '@/db';
import { labResults } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const labResultSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  testName: z.string().min(1),
  testType: z.string().min(1),
  result: z.string().min(1),
  normalRange: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenantCheck = await validateTenantScope(request, id, 'lab_results', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const context = tenantCheck.context!;
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const conditions = [
      eq(labResults.clinicId, id),
      isNull(labResults.deletedAt)
    ];

    if (patientId) {
      conditions.push(eq(labResults.patientId, patientId));
    }

    const results = await db.query.labResults.findMany({
      where: and(...conditions),
      orderBy: (labResults, { desc }) => [desc(labResults.createdAt)],
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch lab results:', error);
    return NextResponse.json({ error: 'Failed to fetch lab results' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'lab_results', 'POST');
    if (!tenantCheck.success) return tenantCheck.response!;

    const body = await request.json();
    const validatedData = labResultSchema.parse(body);

    const [result] = await db.insert(labResults).values({
      clinicId: id,
      ...validatedData,
      status: 'completed',
    }).returning();

    await logAudit({
      action: 'lab_result.created',
      clinicId: id,
      userId: tenantCheck.context?.userId,
      resourceId: result.id,
      details: { testName: validatedData.testName },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create lab result:', error);
    return NextResponse.json({ error: 'Failed to create lab result' }, { status: 500 });
  }
}
