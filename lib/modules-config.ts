// NEW FILE: Module configuration for facility types (3 types only)

export type FacilityType = 'single_clinic' | 'multi_clinic' | 'medical_center';
export type Edition = 'basic' | 'pro' | 'enterprise';

// All possible modules in the system
export const ALL_MODULES = [
  'appointments',
  'patients',
  'medical_records',
  'prescriptions',
  'invoices',
  'payments',
  'specialties',
  'calendar',
  'schedule',
  'live-monitor',
  'staff_management',
  'staff_management_limited',
  'reports',
  'dashboard',
  'vitals',
] as const;

export type Module = typeof ALL_MODULES[number];

// Module mapping for each facility type
export const FACILITY_TYPE_MODULES: Record<FacilityType, Module[]> = {
  single_clinic: [
    'appointments',
    'patients',
    'medical_records',
    'prescriptions',
    'invoices',
    'payments',
    'specialties',
    'calendar',
    'schedule',
    'live-monitor',
    'staff_management_limited',
    'reports',
    'dashboard',
  ],
  multi_clinic: [
    'appointments',
    'patients',
    'medical_records',
    'prescriptions',
    'invoices',
    'payments',
    'specialties',
    'calendar',
    'schedule',
    'live-monitor',
    'staff_management',
    'reports',
    'dashboard',
  ],
  medical_center: [
    'appointments',
    'patients',
    'medical_records',
    'prescriptions',
    'invoices',
    'payments',
    'specialties',
    'calendar',
    'schedule',
    'live-monitor',
    'staff_management',
    'reports',
    'dashboard',
  ],
};

// Get modules for a specific facility type
export function getModulesForFacilityType(facilityType: FacilityType): Module[] {
  return FACILITY_TYPE_MODULES[facilityType] || [];
}

// Check if a module is enabled for a facility type
export function isModuleEnabledForFacilityType(module: Module, facilityType: FacilityType): boolean {
  const modules = getModulesForFacilityType(facilityType);
  return modules.includes(module);
}

// Module display names in Arabic
export const MODULE_DISPLAY_NAMES: Record<Module, string> = {
  appointments: 'المواعيد',
  patients: 'المرضى',
  medical_records: 'السجلات الطبية',
  prescriptions: 'الأدوية',
  invoices: 'الفواتير',
  payments: 'المدفوعات',
  specialties: 'التخصصات',
  calendar: 'التقويم',
  schedule: 'الجدول',
  'live-monitor': 'المراقب المباشر',
  staff_management: 'إدارة طاقم العمل',
  staff_management_limited: 'إدارة الاستقبال',
  reports: 'التقارير',
  dashboard: 'لوحة التحكم',
  vitals: 'العلامات الحيوية',
};

// Facility type display names in Arabic
export const FACILITY_TYPE_DISPLAY_NAMES: Record<FacilityType, string> = {
  single_clinic: 'عيادة طبيب واحد',
  multi_clinic: 'عيادة متعددة أطباء',
  medical_center: 'مركز طبي',
};

// Edition display names in Arabic
export const EDITION_DISPLAY_NAMES: Record<Edition, string> = {
  basic: 'أساسي',
  pro: 'احترافي',
  enterprise: 'Enterprise',
};
