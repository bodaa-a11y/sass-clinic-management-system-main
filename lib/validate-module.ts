// NEW FILE: Module validation helper for API protection

import { db } from '@/db';
import { clinics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * Validate if a module is enabled for a clinic
 * Returns 403 Forbidden if module is not enabled
 */
export async function validateModule(
  clinicId: string,
  moduleName: string
): Promise<{ success: boolean; response?: NextResponse }> {
  try {
    // Fetch clinic configuration
    const clinic = await db
      .select({ enabledModules: clinics.enabledModules })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (clinic.length === 0) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Clinic not found', code: 'NOT_FOUND' },
          { status: 404 }
        ),
      };
    }

    const enabledModules = clinic[0].enabledModules as string[];

    // Check if module is enabled
    if (!enabledModules.includes(moduleName)) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: `Module '${moduleName}' is not enabled for this clinic`,
            code: 'MODULE_NOT_ENABLED',
          },
          { status: 403 }
        ),
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error validating module:', error);
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Failed to validate module',
          code: 'VALIDATION_ERROR',
        },
        { status: 500 }
      ),
    };
  }
}

// CHANGED BY GROK - Module validation helper for client-side
export function validateModuleClient(enabledModules: string[], moduleName: string): boolean {
  if (!enabledModules.includes(moduleName)) {
    console.error(`Module '${moduleName}' is not enabled for this clinic`);
    return false;
  }
  return true;
}
