import { db } from '@/db';
import { patientMessages, users } from '@/db/schema';
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

    // Fetch messages for this patient
    const messages = await db
      .select({
        id: patientMessages.id,
        subject: patientMessages.subject,
        message: patientMessages.message,
        priority: patientMessages.priority,
        isRead: patientMessages.isRead,
        readAt: patientMessages.readAt,
        senderType: patientMessages.senderType,
        senderId: patientMessages.senderId,
        recipientType: patientMessages.recipientType,
        recipientId: patientMessages.recipientId,
        createdAt: patientMessages.createdAt,
        parentId: patientMessages.parentId,
      })
      .from(patientMessages)
      .where(
        and(
          eq(patientMessages.patientId, patientId),
          isNull(patientMessages.deletedAt),
          isNull(patientMessages.parentId) // Only get top-level messages
        )
      )
      .orderBy(desc(patientMessages.createdAt));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
