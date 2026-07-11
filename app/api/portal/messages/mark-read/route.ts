import { db } from '@/db';
import { patientMessages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = request.headers.get('x-patient-id');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID required', code: 'MISSING_PATIENT_ID' },
        { status: 401 }
      );
    }

    const messageId = params.id;

    // Mark message as read
    await db
      .update(patientMessages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(patientMessages.id, messageId),
          eq(patientMessages.patientId, patientId)
        )
      );

    return NextResponse.json(
      { message: 'Message marked as read' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mark message as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
