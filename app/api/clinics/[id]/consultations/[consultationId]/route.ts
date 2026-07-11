/**
 * Consultation API Route
 * 
 * API endpoints for managing clinical examination sessions with auto-save support.
 * 
 * @module app/api/clinics/[id]/consultations/[consultationId]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/consultation-service';
import { validateTenantScope } from '@/lib/tenant';
import type { ConsultationUpdate, ClinicalDataUpdate } from '@/types/consultation';

/**
 * GET /api/clinics/[id]/consultations/[consultationId]
 * Get consultation by ID
 */
const GETHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) => {
  try {
    const { consultationId, id: clinicId } = await params;

    // Validate tenant scope + permission (medical-records:read)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'GET');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const consultation = await consultationService.getById(consultationId);

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ consultation });
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const GET = GETHandler;

/**
 * PATCH /api/clinics/[id]/consultations/[consultationId]
 * Update consultation (full update)
 */
const PATCHHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) => {
  try {
    const { consultationId, id: clinicId } = await params;

    // Validate tenant scope + permission (medical-records:update)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'PATCH');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const body = await request.json() as ConsultationUpdate & { expectedUpdatedAt?: string };

    const consultation = await consultationService.getById(consultationId);

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // If only status is being updated, use updateStatus to bypass lifecycle enforcement
    if (Object.keys(body).length === 1 && 'status' in body && body.status) {
      const updated = await consultationService.updateStatus(consultationId, body.status);
      return NextResponse.json({ consultation: updated });
    }

    // Optimistic locking check
    if (body.expectedUpdatedAt) {
      const expectedDate = new Date(body.expectedUpdatedAt);
      const current = new Date(consultation.updatedAt);

      if (current > expectedDate) {
        return NextResponse.json(
          {
            error: 'CONFLICT: Consultation was modified by another user',
            requiresRefresh: true,
            currentUpdatedAt: consultation.updatedAt
          },
          { status: 409 }
        );
      }
    }

    const updated = await consultationService.update(consultationId, body);

    return NextResponse.json({ consultation: updated });
  } catch (error) {
    console.error('Error updating consultation:', error);

    if (error instanceof Error && error.message.includes('read-only')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const PATCH = PATCHHandler;

/**
 * DELETE /api/clinics/[id]/consultations/[consultationId]
 * Delete consultation
 */
const DELETEHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) => {
  try {
    const { consultationId, id: clinicId } = await params;

    // Validate tenant scope + permission (medical-records:delete)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'DELETE');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const consultation = await consultationService.getById(consultationId);

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of non-completed consultations
    if (consultation.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete completed consultation' },
        { status: 403 }
      );
    }

    await consultationService.softDelete(consultationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const DELETE = DELETEHandler;
