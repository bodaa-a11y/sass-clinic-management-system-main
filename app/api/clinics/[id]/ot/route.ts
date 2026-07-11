// NEW FILE: OT API route stub with module validation

import { db } from '@/db'
import { clinics } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { validateModule } from '@/lib/validate-module'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const moduleCheck = await validateModule(id, 'ot')
    if (!moduleCheck.success) {
      return moduleCheck.response!
    }

    const clinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1)

    if (clinic.length === 0) {
      return NextResponse.json(
        { error: 'Clinic not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: [],
      message: 'OT module is under development',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch OT data', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const moduleCheck = await validateModule(id, 'ot')
    if (!moduleCheck.success) {
      return moduleCheck.response!
    }

    return NextResponse.json({
      message: 'OT module is under development',
      code: 'UNDER_DEVELOPMENT',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create OT record', code: 'CREATE_ERROR' },
      { status: 500 }
    )
  }
}
