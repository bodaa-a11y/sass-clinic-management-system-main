'use client'

import { useContext, createContext, ReactNode } from 'react'
import { store } from '@/lib/store'
import { FacilityType } from '@/lib/modules-config'

interface FacilityConfig {
  facilityType: FacilityType
  isSingleDoctor: boolean
  isMultiClinic: boolean
  isMedicalCenter: boolean
  showBranchSelector: boolean
  showDoctorSelector: boolean
  enableStaffManagement: boolean
  enableReports: boolean
}

const FacilityConfigContext = createContext<FacilityConfig | null>(null)

interface FacilityConfigProviderProps {
  children: ReactNode
}

export function FacilityConfigProvider({ children }: FacilityConfigProviderProps) {
  const user = store.getUser()
  const facilityType = (user?.clinicConfig?.facilityType as FacilityType) || 'single_clinic'

  const config: FacilityConfig = {
    facilityType,
    isSingleDoctor: facilityType === 'single_clinic',
    isMultiClinic: facilityType === 'multi_clinic',
    isMedicalCenter: facilityType === 'medical_center',
    showBranchSelector: facilityType === 'multi_clinic' || facilityType === 'medical_center',
    showDoctorSelector: facilityType === 'multi_clinic' || facilityType === 'medical_center',
    enableStaffManagement: facilityType === 'multi_clinic' || facilityType === 'medical_center',
    enableReports: facilityType === 'multi_clinic' || facilityType === 'medical_center',
  }

  return (
    <FacilityConfigContext.Provider value={config}>
      {children}
    </FacilityConfigContext.Provider>
  )
}

export function useFacilityConfig(): FacilityConfig {
  const context = useContext(FacilityConfigContext)
  if (!context) {
    const user = store.getUser()
    const facilityType = (user?.clinicConfig?.facilityType as FacilityType) || 'single_clinic'
    return {
      facilityType,
      isSingleDoctor: facilityType === 'single_clinic',
      isMultiClinic: facilityType === 'multi_clinic',
      isMedicalCenter: facilityType === 'medical_center',
      showBranchSelector: facilityType === 'multi_clinic' || facilityType === 'medical_center',
      showDoctorSelector: facilityType === 'multi_clinic' || facilityType === 'medical_center',
      enableStaffManagement: facilityType === 'multi_clinic' || facilityType === 'medical_center',
      enableReports: facilityType === 'multi_clinic' || facilityType === 'medical_center',
    }
  }
  return context
}
