import { z } from 'zod';
import { db } from '@/db';
import { labIntegrations } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const labIntegrationUpdateSchema = z.object({
  labName: z.string().min(1).optional(),
  labType: z.enum(['internal', 'external']).optional(),
  apiEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  supportedTests: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> }
) {
  try {
    const { id, integrationId } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'lab_integrations', 'PUT');
    if (!tenantCheck.success) return tenantCheck.response!;

    const body = await request.json();
    const validatedData = labIntegrationUpdateSchema.parse(body);

    const [integration] = await db.update(labIntegrations)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(labIntegrations.id, integrationId),
        eq(labIntegrations.clinicId, id)
      ))
      .returning();

    if (!integration) {
      return NextResponse.json({ error: 'Lab integration not found' }, { status: 404 });
    }

    await logAudit({
      action: 'lab_integration.updated',
      clinicId: id,
      userId: tenantCheck.context?.userId,
      resourceId: integrationId,
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Failed to update lab integration:', error);
    return NextResponse.json({ error: 'Failed to update lab integration' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> }
) {
  try {
    const { id, integrationId } = await params;
    const tenantCheck = await validateTenantScope(request, id, 'lab_integrations', 'DELETE');
    if (!tenantCheck.success) return tenantCheck.response!;

    const [integration] = await db.update(labIntegrations)
      .set({
        deletedAt: new Date(),
      })
      .where(and(
        eq(labIntegrations.id, integrationId),
        eq(labIntegrations.clinicId, id)
      ))
      .returning();

    if (!integration) {
      return NextResponse.json({ error: 'Lab integration not found' }, { status: 404 });
    }

    await logAudit({
      action: 'lab_integration.deleted',
      clinicId: id,
      userId: tenantCheck.context?.userId,
      resourceId: integrationId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lab integration:', error);
    return NextResponse.json({ error: 'Failed to delete lab integration' }, { status: 500 });
  }
}
