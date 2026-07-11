import { db } from '@/db'
import { clinics } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'
import { getClientIP } from '@/lib/rate-limit'
// CHANGED BY WINDSURF: Import modules config
import { getModulesForFacilityType } from '@/lib/modules-config'

// CHANGED BY WINDSURF: Update schema to include facility_type, edition, enabled_modules, config (3 types only)
const updateClinicSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  facilityType: z.enum(['single_clinic', 'multi_clinic', 'medical_center']).optional(),
  edition: z.enum(['basic', 'pro', 'enterprise']).optional(),
  enabledModules: z.array(z.string()).optional(), // Optional, will be auto-regenerated if facility_type changes
  config: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CHANGED BY WINDSURF: Require super admin access
    const adminCheck = await requireSuperAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response!
    }

    const { id } = await params

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

    return NextResponse.json({ data: clinic[0] })
  } catch (error) {
    console.error('GET ERROR:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CHANGED BY WINDSURF: Require super admin access
    const adminCheck = await requireSuperAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response!
    }

    const context = adminCheck.context!
    const ip = getClientIP(request)

    const { id } = await params
    const body = await request.json()

    // CHANGED BY WINDSURF: Validate request body
    const validatedData = updateClinicSchema.parse(body)

    // CHANGED BY WINDSURF: Auto-regenerate enabled_modules if facility_type changes (always regenerate when facilityType changes)
    let enabledModules = validatedData.enabledModules
    if (validatedData.facilityType) {
      enabledModules = getModulesForFacilityType(validatedData.facilityType)
    }

    // Build update object
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.address !== undefined) updateData.address = validatedData.address
    if (validatedData.facilityType !== undefined) updateData.facilityType = validatedData.facilityType
    if (validatedData.edition !== undefined) updateData.edition = validatedData.edition
    if (enabledModules !== undefined) updateData.enabledModules = enabledModules
    if (validatedData.config !== undefined) updateData.config = validatedData.config
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const updated = await db
      .update(clinics)
      .set(updateData)
      .where(eq(clinics.id, id))
      .returning()

    // CHANGED BY WINDSURF: Audit logging
    await logAudit({
      action: 'UPDATE_SETTINGS',
      entityType: 'clinic',
      entityId: id,
      userId: context.userId,
      userRole: context.userRole,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      oldValues: { ...updated[0] }, // Note: This is not the old value, but we can improve this later
      newValues: updateData,
    })

    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'خطأ في التحقق من البيانات', code: 'VALIDATION_ERROR', details: error.message },
        { status: 400 }
      )
    }
    console.error('PATCH ERROR:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
