import { StateCreator } from 'zustand'

export interface UISlice {
  // State
  isExamMode: boolean
  isMedicalRecordsMode: boolean
  isPrescriptionStepOpen: boolean
  isLoading: boolean

  // Dialog States
  dialogs: {
    labResult: boolean
    vaccination: boolean
    prescriptionRenewal: boolean
    labIntegration: boolean
  }

  // Actions
  setExamMode: (mode: boolean) => void
  setMedicalRecordsMode: (mode: boolean) => void
  setPrescriptionStepOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (dialog: keyof UISlice['dialogs'], open: boolean) => void
  closeAllDialogs: () => void
  resetUIState: () => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Initial State
  isExamMode: false,
  isMedicalRecordsMode: false,
  isPrescriptionStepOpen: false,
  isLoading: true,
  dialogs: {
    labResult: false,
    vaccination: false,
    prescriptionRenewal: false,
    labIntegration: false,
  },

  // Actions
  setExamMode: (mode) => set({ isExamMode: mode }),
  setMedicalRecordsMode: (mode) => set({ isMedicalRecordsMode: mode }),
  setPrescriptionStepOpen: (open) => set({ isPrescriptionStepOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
  setDialogOpen: (dialog, open) => set((state) => ({
    dialogs: { ...state.dialogs, [dialog]: open }
  })),
  closeAllDialogs: () => set({
    dialogs: {
      labResult: false,
      vaccination: false,
      prescriptionRenewal: false,
      labIntegration: false,
    }
  }),
  resetUIState: () => set({
    isExamMode: false,
    isMedicalRecordsMode: false,
    isPrescriptionStepOpen: false,
    isLoading: false,
  }),
})
