import { db } from '@/db';
import { appointments } from '@/db/schema';
import { validateTenantScope } from '@/lib/tenant';
import { eq, and, isNull } from 'drizzle-orm';
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
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial data
      try {
        const initialData = await db.query.appointments.findMany({
          where: and(
            eq(appointments.clinicId, id),
            eq(appointments.status, 'in-waiting-room'),
            isNull(appointments.deletedAt)
          ),
        });
        sendEvent({ type: 'initial', data: initialData });
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        sendEvent({ type: 'error', error: 'Failed to fetch initial data' });
      }

      // Polling fallback (every 5 seconds)
      const interval = setInterval(async () => {
        try {
          const currentData = await db.query.appointments.findMany({
            where: and(
              eq(appointments.clinicId, id),
              eq(appointments.status, 'in-waiting-room'),
              isNull(appointments.deletedAt)
            ),
          });
          sendEvent({ type: 'update', data: currentData });
        } catch (error) {
          console.error('SSE polling error:', error);
        }
      }, 5000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
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
