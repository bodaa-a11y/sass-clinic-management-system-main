import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Temporary endpoint to fix staff roles from 'admin' to 'receptionist'
export async function GET() {
  try {
    // Use raw SQL to bypass type checking
    const result = await db.execute(
      sql`UPDATE staff SET role = 'receptionist' WHERE role = 'admin' RETURNING *`
    );

    return NextResponse.json({
      message: 'Staff roles updated successfully',
      updated: result.rows.length,
      staff: result.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update staff' },
      { status: 500 }
    );
  }
}
