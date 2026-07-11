/**
 * Consultation Auto-Save API Route
 * 
 * Endpoint for auto-saving clinical data with debouncing support.
 * Implements optimistic locking and retry logic.
 * 
 * @module app/api/clinics/[id]/consultations/[consultationId]/auto-save/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/consultation-service';
import { validateTenantScope } from '@/lib/tenant';
import type { ClinicalDataUpdate } from '@/types/consultation';

/**
 * POST /api/clinics/[id]/consultations/[consultationId]/auto-save
 * Auto-save clinical data with optimistic locking
 */
const POSTHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) => {
  try {
    const { consultationId, id: clinicId } = await params;

    // Validate tenant scope + permission (medical-records:update)
    const tenantCheck = await validateTenantScope(request, clinicId, 'medical-records', 'POST');
    if (!tenantCheck.success) {
      return tenantCheck.response!;
    }

    const body = await request.json() as ClinicalDataUpdate & { expectedUpdatedAt?: string };

    const consultation = await consultationService.getById(consultationId);

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Return early if consultation is completed (don't throw error, just return OK)
    if (consultation.status === 'completed' || consultation.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        completed: true,
        message: 'Consultation is completed, auto-save stopped'
      });
    }

    const expectedUpdatedAt = body.expectedUpdatedAt
      ? new Date(body.expectedUpdatedAt)
      : undefined;

    // Auto-save with retry logic
    const updated = await consultationService.autoSaveClinicalData(
      consultationId,
      {
        vitals: body.vitals,
        specialtyData: body.specialtyData,
        sectionsProgress: body.sectionsProgress,
      },
      expectedUpdatedAt
    );

    return NextResponse.json({
      success: true,
      consultation: updated,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    console.error('Error auto-saving consultation:', error);

    if (error instanceof Error && error.message.includes('CONFLICT')) {
      return NextResponse.json(
        {
          error: 'CONFLICT: Consultation was modified by another user',
          requiresRefresh: true
        },
        { status: 409 }
      );
    }

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

export const POST = POSTHandler;
