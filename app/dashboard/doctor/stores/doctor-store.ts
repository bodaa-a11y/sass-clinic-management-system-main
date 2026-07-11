import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createPatientSlice, PatientSlice } from './slices/patient-slice'
import { createUISlice, UISlice } from './slices/ui-slice'
import { createFormSlice, FormSlice } from './slices/form-slice'

export type DoctorStore = PatientSlice & UISlice & FormSlice

export const useDoctorStore = create<DoctorStore>()(
  devtools(
    (set, get, api) => ({
      ...createPatientSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createFormSlice(set, get, api),
    }),
    {
      name: 'cura-doctor-store',
    }
  )
)
