import { db } from '@/db';
import { appointments, clinics, patients, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';
import { getClientIP } from '@/lib/rate-limit';
import { requireSuperAdmin } from '@/lib/admin-auth';
// CHANGED BY WINDSURF: Import modules config
import { getModulesForFacilityType } from '@/lib/modules-config';

export async function GET(request: NextRequest) {
  try {
    // Require super admin access
    const adminCheck = await requireSuperAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }

    const context = adminCheck.context!;
    const ip = getClientIP(request);

    // Get all clinics
    const allClinics = await db
      .select({
        id: clinics.id,
        name: clinics.name,
        slug: clinics.slug,
        phone: clinics.phone,
        isActive: clinics.isActive,
        createdAt: clinics.createdAt,
        facilityType: clinics.facilityType,
        edition: clinics.edition,
        enabledModules: clinics.enabledModules,
        config: clinics.config,
      })
      .from(clinics)
      .orderBy(clinics.createdAt);

    // Get counts for each clinic
    const clinicsWithCounts = await Promise.all(
      allClinics.map(async (clinic) => {
        const patientCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(patients)
          .where(eq(patients.clinicId, clinic.id));

        const appointmentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(appointments)
          .where(eq(appointments.clinicId, clinic.id));

        return {
          ...clinic,
          patientCount: patientCount[0]?.count || 0,
          appointmentCount: appointmentCount[0]?.count || 0,
        };
      })
    );

    // Audit logging
    await logAudit({
      action: 'ADMIN_VIEW_CLINICS',
      entityType: 'clinic',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      userId: context.userId,
      userRole: context.userRole,
    });

    return NextResponse.json({
      data: clinicsWithCounts,
      count: clinicsWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch clinics',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

// CHANGED BY WINDSURF: Update schema to include facility_type, edition, enabled_modules, config (3 types only)
const createClinicSchema = z.object({
  name: z.string().min(1, 'اسم العيادة مطلوب'),
  slug: z.string().min(1, 'Slug مطلوب'),
  phone: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').max(20, 'كلمة المرور يجب أن لا تتجاوز 20 حرفاً'),
  facilityType: z.enum(['single_clinic', 'multi_clinic', 'medical_center']).default('single_clinic'),
  edition: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  enabledModules: z.array(z.string()).optional(), // Optional, will be auto-generated if not provided
  config: z.record(z.string(), z.any()).optional(), // Optional additional config
});

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    const adminCheck = await requireSuperAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }

    const context = adminCheck.context!;
    const ip = getClientIP(request);

    const body = await request.json();
    console.log('POST body:', body);
    const validatedData = createClinicSchema.parse(body);

    // Check if slug already exists
    const existingClinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, validatedData.slug))
      .limit(1);

    if (existingClinic.length > 0) {
      return NextResponse.json(
        { error: 'Slug مستخدم مسبقاً', code: 'DUPLICATE_SLUG' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم مسبقاً', code: 'DUPLICATE_EMAIL' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // CHANGED BY WINDSURF: Auto-generate enabled_modules if not provided
    const enabledModules = validatedData.enabledModules || getModulesForFacilityType(validatedData.facilityType);

    // Step 1: Create clinic
    const newClinic = await db
      .insert(clinics)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        phone: validatedData.phone || null,
        facilityType: validatedData.facilityType,
        edition: validatedData.edition,
        enabledModules: enabledModules,
        config: validatedData.config || {},
        isActive: true,
      })
      .returning();

    try {
      // Step 2: Create user
      const newUser = await db
        .insert(users)
        .values({
          email: validatedData.email,
          passwordHash: hashedPassword,
          role: 'clinic_admin',
          clinicId: newClinic[0].id,
        })
        .returning();

      // Return success response
      const response = {
        clinic: {
          id: newClinic[0].id,
          name: newClinic[0].name,
          slug: newClinic[0].slug,
        },
        credentials: {
          email: newUser[0].email,
          password: validatedData.password, // Plain text for display only
        },
      };

      // Audit logging
      await logAudit({
        action: 'ADMIN_CREATE_CLINIC',
        entityType: 'clinic',
        entityId: newClinic[0].id,
        userId: context.userId,
        userRole: context.userRole,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        newValues: {
          clinic: newClinic[0],
          adminUser: {
            email: newUser[0].email,
            role: newUser[0].role,
          },
        },
      });

      return NextResponse.json(response);
    } catch (userError) {
      // Cleanup: delete clinic if user creation fails
      await db.delete(clinics).where(eq(clinics.id, newClinic[0].id));
      throw userError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'خطأ في التحقق من البيانات', code: 'VALIDATION_ERROR', details: error.message },
        { status: 400 }
      );
    }

    console.error('POST ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'فشل إنشاء العيادة', code: 'CREATE_ERROR' },
      { status: 500 }
    );
  }
}
