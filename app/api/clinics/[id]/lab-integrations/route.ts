import { z } from 'zod';
import { db } from '@/db';
import { labIntegrations } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const labIntegrationSchema = z.object({
  labName: z.string().min(1),
  labType: z.enum(['internal', 'external']),
  apiEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  supportedTests: z.array(z.string()).default([]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'lab_integrations', 'GET');
    if (!tenantCheck.success) return tenantCheck.response!;

    const integrations = await db.query.labIntegrations.findMany({
      where: and(
        eq(labIntegrations.clinicId, id),
        isNull(labIntegrations.deletedAt)
      ),
      orderBy: (labIntegrations, { desc }) => [desc(labIntegrations.createdAt)],
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Failed to fetch lab integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch lab integrations' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'lab_integrations', 'POST');
    if (!tenantCheck.success) return tenantCheck.response!;

    const body = await request.json();
    const validatedData = labIntegrationSchema.parse(body);

    const [integration] = await db.insert(labIntegrations).values({
      clinicId: id,
      ...validatedData,
    }).returning();

    await logAudit({
      action: 'lab_integration.created',
      clinicId: id,
      userId: tenantCheck.context?.userId,
      resourceId: integration.id,
      details: { labName: validatedData.labName },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error('Failed to create lab integration:', error);
    return NextResponse.json({ error: 'Failed to create lab integration' }, { status: 500 });
  }
}
