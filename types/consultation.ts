/**
 * Consultation Types
 * 
 * TypeScript interfaces for the consultations table and clinical data structure.
 */

/**
 * Clinical Data Structure (JSONB)
 */
export interface ClinicalData {
  vitals: VitalsData;
  specialtyData: Record<string, unknown>;
  sectionsProgress: SectionsProgress;
}

/**
 * Vitals Data
 */
export interface VitalsData {
  bp?: string; // Blood pressure (e.g., "120/80")
  hr?: number; // Heart rate (bpm)
  temp?: number; // Temperature (Celsius)
  weight?: number; // Weight (kg)
  height?: number; // Height (cm)
  bmi?: number; // Body Mass Index
  spo2?: number; // Oxygen saturation (%)
  rr?: number; // Respiratory rate (bpm)
}

/**
 * Sections Progress Tracking
 */
export interface SectionsProgress {
  vitals?: boolean;
  examination?: boolean;
  diagnosis?: boolean;
  prescription?: boolean;
  labs?: boolean;
  radiology?: boolean;
}

/**
 * Consultation Status
 */
export type ConsultationStatus = 'arrived' | 'in-progress' | 'completed' | 'cancelled';

/**
 * Consultation Entity
 */
export interface Consultation {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  
  // Session lifecycle
  status: ConsultationStatus;
  startTime: Date;
  endTime?: Date | null;
  
  // Core clinical data
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  
  // Configurable clinical data
  clinicalData: ClinicalData;
  
  // Metadata
  notes?: string | null;
  followUpDate?: Date | null;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Consultation Input (for creating/updating)
 */
export interface ConsultationInput {
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status?: ConsultationStatus;
  chiefComplaint?: string;
  diagnosis?: string;
  clinicalData?: Partial<ClinicalData>;
  notes?: string;
  followUpDate?: Date;
}

/**
 * Consultation Update (partial update)
 */
export interface ConsultationUpdate {
  status?: ConsultationStatus;
  endTime?: Date;
  chiefComplaint?: string;
  diagnosis?: string;
  clinicalData?: Partial<ClinicalData>;
  notes?: string;
  followUpDate?: Date;
}

/**
 * Clinical Data Update (for auto-save)
 */
export interface ClinicalDataUpdate {
  vitals?: Partial<VitalsData>;
  specialtyData?: Record<string, unknown>;
  sectionsProgress?: Partial<SectionsProgress>;
}

/**
 * Specialty Data Examples (for documentation)
 */
export interface OphthalmologyData {
  intraocularPressure?: {
    left: number;
    right: number;
  };
  visionAcuity?: {
    left: string;
    right: string;
  };
  fundusExam?: {
    left: string;
    right: string;
  };
}

export interface CardiologyData {
  heartSounds?: string;
  murmurs?: string;
  rhythm?: string;
  ecg?: string;
}

export interface DermatologyData {
  lesions?: Array<{
    location: string;
    description: string;
    size: string;
  }>;
  rash?: string;
  photos?: string[];
}
