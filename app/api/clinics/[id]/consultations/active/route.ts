/**
 * Get Active Consultation API Route
 * 
 * Returns active consultation for a patient if exists.
 * 
 * @module app/api/clinics/[id]/consultations/active/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/consultation-service';
import { withTenantContext } from '@/lib/tenant-middleware';

/**
 * GET /api/clinics/[id]/consultations/active?patientId=xxx
 * Get active consultation for patient
 */
const GETHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: clinicId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing patientId parameter' },
        { status: 400 }
      );
    }

    const consultation = await consultationService.getActiveByPatient(
      patientId,
      clinicId
    );

    if (!consultation) {
      return NextResponse.json({
        consultation: null
      });
    }

    return NextResponse.json({ consultation });
  } catch (error) {
    console.error('Error fetching active consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const GET = withTenantContext(GETHandler);
