import { z } from 'zod';
import { db } from '@/db';
import { patientMessages } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';

const sendMessageSchema = z.object({
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  recipientId: z.string().uuid('Invalid recipient ID'),
  recipientType: z.enum(['staff', 'patient']),
});

export async function POST(request: NextRequest) {
  try {
    const patientId = request.headers.get('x-patient-id');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID required', code: 'MISSING_PATIENT_ID' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Create new message
    const result = await db
      .insert(patientMessages)
      .values({
        patientId,
        senderId: patientId,
        senderType: 'patient',
        recipientId: validatedData.recipientId,
        recipientType: validatedData.recipientType,
        subject: validatedData.subject,
        message: validatedData.message,
        priority: validatedData.priority,
        isRead: false,
      })
      .returning();

    const newMessage = Array.isArray(result) ? result[0] : result;

    return NextResponse.json(
      { message: 'Message sent successfully', data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
