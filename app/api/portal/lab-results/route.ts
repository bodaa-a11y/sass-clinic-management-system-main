import { db } from '@/db';
import { labResults, users } from '@/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const patientId = request.headers.get('x-patient-id');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID required', code: 'MISSING_PATIENT_ID' },
        { status: 401 }
      );
    }

    // Fetch lab results for this patient
    const results = await db
      .select({
        id: labResults.id,
        testName: labResults.testName,
        testType: labResults.testType,
        result: labResults.result,
        normalRange: labResults.normalRange,
        status: labResults.status,
        testDate: labResults.testDate,
        verifiedAt: labResults.verifiedAt,
        notes: labResults.notes,
        cloudinaryUrl: labResults.cloudinaryUrl,
        fileName: labResults.fileName,
        createdAt: labResults.createdAt,
      })
      .from(labResults)
      .where(
        and(
          eq(labResults.patientId, patientId),
          isNull(labResults.deletedAt)
        )
      )
      .orderBy(desc(labResults.testDate), desc(labResults.createdAt));

    return NextResponse.json(
      { results },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch lab results error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
