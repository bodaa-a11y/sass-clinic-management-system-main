import { db } from '@/db';
import { clinics } from '@/db/schema';
import { count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await db.select({ count: count() }).from(clinics);
    const clinicCount = result[0]?.count ?? 0;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      clinicsCount: clinicCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
