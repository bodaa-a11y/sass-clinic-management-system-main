import { db } from '@/db';
import { appointments, patients, users } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tenantCheck = await validateTenantScope(request, id, 'appointments', 'GET');
  if (!tenantCheck.success) {
    return tenantCheck.response!;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          // Controller already closed
          isClosed = true;
        }
      };

      // Send initial data
      try {
        const initialData = await db
          .select({
            id: appointments.id,
            clinicId: appointments.clinicId,
            patientId: appointments.patientId,
            doctorId: appointments.doctorId,
            appointmentDate: appointments.appointmentDate,
            startTime: appointments.startTime,
            status: appointments.status,
            priority: appointments.priority,
            notes: appointments.notes,
            createdAt: appointments.createdAt,
            patientName: patients.fullName,
            patientPhone: patients.phone,
            doctorName: users.name,
          })
          .from(appointments)
          .leftJoin(patients, eq(appointments.patientId, patients.id))
          .leftJoin(users, eq(appointments.doctorId, users.id))
          .where(and(
            eq(appointments.clinicId, id),
            isNull(appointments.deletedAt)
          ))
          .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
        sendEvent({ type: 'initial', data: initialData });
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        sendEvent({ type: 'error', error: 'Failed to fetch initial data' });
      }

      // Polling fallback (every 3 seconds for reception - faster than doctor's 5 seconds)
      let lastDataHash = '';

      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          const currentData = await db
            .select({
              id: appointments.id,
              clinicId: appointments.clinicId,
              patientId: appointments.patientId,
              doctorId: appointments.doctorId,
              appointmentDate: appointments.appointmentDate,
              startTime: appointments.startTime,
              status: appointments.status,
              priority: appointments.priority,
              notes: appointments.notes,
              createdAt: appointments.createdAt,
              patientName: patients.fullName,
              patientPhone: patients.phone,
              doctorName: users.name,
            })
            .from(appointments)
            .leftJoin(patients, eq(appointments.patientId, patients.id))
            .leftJoin(users, eq(appointments.doctorId, users.id))
            .where(and(
              eq(appointments.clinicId, id),
              isNull(appointments.deletedAt)
            ))
            .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));

          // Only send if data has changed
          const currentHash = JSON.stringify(currentData);
          if (currentHash !== lastDataHash) {
            sendEvent({ type: 'update', data: currentData });
            lastDataHash = currentHash;
          }
        } catch (error) {
          console.error('SSE polling error:', error);
          isClosed = true;
          clearInterval(interval);
        }
      }, 3000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
