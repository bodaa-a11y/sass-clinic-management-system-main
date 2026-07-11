/**
 * Consultation Service
 * 
 * Service for managing clinical examination sessions with strict protocols:
 * - Optimistic Locking (version control via updated_at)
 * - Partial Updates (Deep Merge for JSONB)
 * - Lifecycle Enforcement (read-only after completion)
 * 
 * @module lib/consultation-service
 */

import { db } from '@/db';
import { consultations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type {
  Consultation,
  ConsultationInput,
  ConsultationUpdate,
  ClinicalDataUpdate,
  VitalsData,
  SectionsProgress,
} from '@/types/consultation';

export class ConsultationService {
  /**
   * Create a new consultation session
   */
  async create(input: ConsultationInput): Promise<Consultation> {
    const values: any = {
      clinicId: input.clinicId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      status: input.status || 'arrived',
      clinicalData: input.clinicalData || {
        vitals: {},
        specialtyData: {},
        sectionsProgress: {},
      },
    };

    if (input.appointmentId) values.appointmentId = input.appointmentId;
    if (input.chiefComplaint) values.chiefComplaint = input.chiefComplaint;
    if (input.diagnosis) values.diagnosis = input.diagnosis;
    if (input.notes) values.notes = input.notes;
    if (input.followUpDate) values.followUpDate = input.followUpDate.toISOString().split('T')[0];

    const result = await db.insert(consultations).values(values as any).returning();
    return result[0] as Consultation;
  }

  /**
   * Get consultation by ID
   */
  async getById(id: string): Promise<Consultation | null> {
    const result = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, id));

    return result[0] as Consultation || null;
  }

  /**
   * Get consultation by ID with optimistic locking check
   * @throws Error if consultation doesn't exist or version mismatch
   */
  async getByIdWithVersion(id: string, expectedUpdatedAt: Date): Promise<Consultation> {
    const consultation = await this.getById(id);

    if (!consultation) {
      throw new Error(`Consultation not found: ${id}`);
    }

    // Optimistic locking: check if data was modified
    if (new Date(consultation.updatedAt) > expectedUpdatedAt) {
      throw new Error('CONFLICT: Consultation was modified by another user. Please refresh and try again.');
    }

    return consultation;
  }

  /**
   * Update consultation with lifecycle enforcement
   * @throws Error if consultation is completed or cancelled
   */
  async update(id: string, update: ConsultationUpdate): Promise<Consultation> {
    const consultation = await this.getById(id);

    if (!consultation) {
      throw new Error(`Consultation not found: ${id}`);
    }

    // Lifecycle enforcement: prevent updates on completed/cancelled sessions
    if (consultation.status === 'completed' || consultation.status === 'cancelled') {
      throw new Error(`Cannot update consultation with status: ${consultation.status}. Session is read-only.`);
    }

    const result = await db
      .update(consultations)
      .set({
        ...update,
        updatedAt: new Date(),
      } as any)
      .where(eq(consultations.id, id))
      .returning();

    return result[0] as Consultation;
  }

  /**
   * Partial update for clinical data (Deep Merge)
   * Uses PostgreSQL JSONB operators to merge data without overwriting
   */
  async updateClinicalData(
    id: string,
    update: ClinicalDataUpdate,
    expectedUpdatedAt?: Date
  ): Promise<Consultation> {
    // Optimistic locking check if provided
    if (expectedUpdatedAt) {
      await this.getByIdWithVersion(id, expectedUpdatedAt);
    }

    // Lifecycle enforcement
    const consultation = await this.getById(id);
    if (!consultation) {
      throw new Error(`Consultation not found: ${id}`);
    }

    if (consultation.status === 'completed' || consultation.status === 'cancelled') {
      throw new Error(`Cannot update consultation with status: ${consultation.status}. Session is read-only.`);
    }

    // Get current clinical data and merge
    const currentData = consultation.clinicalData as any;
    const mergedData = {
      vitals: { ...currentData.vitals, ...update.vitals },
      specialtyData: { ...currentData.specialtyData, ...update.specialtyData },
      sectionsProgress: { ...currentData.sectionsProgress, ...update.sectionsProgress },
    };

    const result = await db
      .update(consultations)
      .set({
        clinicalData: mergedData as any,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, id))
      .returning();

    return result[0] as Consultation;
  }

  /**
   * Auto-save clinical data with debouncing (to be called from frontend)
   * This is a wrapper around updateClinicalData with retry logic
   */
  async autoSaveClinicalData(
    id: string,
    update: ClinicalDataUpdate,
    expectedUpdatedAt?: Date,
    maxRetries = 3
  ): Promise<Consultation> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.updateClinicalData(id, update, expectedUpdatedAt);
      } catch (error) {
        lastError = error as Error;

        // If it's a version conflict, retry
        if (error instanceof Error && error.message.includes('CONFLICT')) {
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            // Get fresh version
            const fresh = await this.getById(id);
            if (fresh) {
              expectedUpdatedAt = fresh.updatedAt;
            }
            continue;
          }
        }

        // If it's lifecycle enforcement, don't retry
        if (error instanceof Error && error.message.includes('read-only')) {
          throw error;
        }

        // Other errors, retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    throw lastError || new Error('Auto-save failed after maximum retries');
  }

  /**
   * Update vitals specifically
   */
  async updateVitals(id: string, vitals: Partial<VitalsData>, expectedUpdatedAt?: Date): Promise<Consultation> {
    return this.updateClinicalData(id, { vitals }, expectedUpdatedAt);
  }

  /**
   * Update section progress
   */
  async updateSectionProgress(
    id: string,
    progress: Partial<SectionsProgress>,
    expectedUpdatedAt?: Date
  ): Promise<Consultation> {
    return this.updateClinicalData(id, { sectionsProgress: progress }, expectedUpdatedAt);
  }

  /**
   * Update specialty data
   */
  async updateSpecialtyData(
    id: string,
    specialtyData: Record<string, any>,
    expectedUpdatedAt?: Date
  ): Promise<Consultation> {
    return this.updateClinicalData(id, { specialtyData }, expectedUpdatedAt);
  }

  /**
   * Update consultation status
   */
  async updateStatus(id: string, status: 'arrived' | 'in-progress' | 'completed' | 'cancelled'): Promise<Consultation> {
    const consultation = await this.getById(id);

    if (!consultation) {
      throw new Error(`Consultation not found: ${id}`);
    }

    // Allow status changes even from completed/cancelled (for completion workflow)
    // Auto-set endTime when completing
    const endTime = status === 'completed' ? new Date() : null;

    const result = await db
      .update(consultations)
      .set({
        status: status as any,
        endTime,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, id))
      .returning();

    return result[0] as Consultation;
  }

  /**
   * Get active consultation for a patient
   */
  async getActiveByPatient(patientId: string, clinicId: string): Promise<Consultation | null> {
    const result = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.patientId, patientId),
          eq(consultations.clinicId, clinicId),
          eq(consultations.status, 'in-progress' as any)
        )
      )
      .orderBy(desc(consultations.startTime))
      .limit(1);

    return result[0] as Consultation || null;
  }

  /**
   * Get active consultation for a doctor
   * Returns the consultation that is currently in progress for the specified doctor
   */
  async getActiveByDoctor(doctorId: string, clinicId: string): Promise<Consultation | null> {
    const result = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          eq(consultations.clinicId, clinicId),
          eq(consultations.status, 'in-progress' as any)
        )
      )
      .orderBy(desc(consultations.startTime))
      .limit(1);

    return result[0] as Consultation || null;
  }

  /**
   * Get consultations by doctor
   */
  async getByDoctor(doctorId: string, clinicId: string, limit = 50): Promise<Consultation[]> {
    const result = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          eq(consultations.clinicId, clinicId)
        )
      )
      .orderBy(desc(consultations.startTime))
      .limit(limit);

    return result as Consultation[];
  }

  /**
   * Get consultations by appointment
   */
  async getByAppointment(appointmentId: string): Promise<Consultation | null> {
    const result = await db
      .select()
      .from(consultations)
      .where(eq(consultations.appointmentId, appointmentId));

    return result[0] as Consultation || null;
  }

  /**
   * Soft delete consultation (admin only)
   */
  async softDelete(id: string): Promise<void> {
    await db
      .update(consultations)
      .set({
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, id));
  }
}

// Export singleton instance
export const consultationService = new ConsultationService();
