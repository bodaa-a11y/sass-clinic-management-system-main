import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { patients } from '@/db/schema'
import { eq, or, like } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Search by phone or name
    const searchResults = await db
      .select()
      .from(patients)
      .where(
        or(
          like(patients.phone, `%${query}%`),
          like(patients.fullName, `%${query}%`)
        )
      )
      .limit(10)

    return NextResponse.json({ data: searchResults })
  } catch (error) {
    console.error('Search patients error:', error)
    return NextResponse.json({ error: 'Failed to search patients' }, { status: 500 })
  }
}
