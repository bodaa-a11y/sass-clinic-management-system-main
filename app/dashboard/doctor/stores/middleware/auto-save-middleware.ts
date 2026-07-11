import { StateCreator, StoreMutatorIdentifier } from 'zustand'
import { FormSlice } from '../slices/form-slice'

// Auto-save middleware for forms
export interface AutoSaveState {
  _hasUnsavedChanges: boolean
  _lastSavedAt: Date | null
}

export type AutoSaveMiddleware = <
  T extends FormSlice,
  M extends [StoreMutatorIdentifier, unknown][]
>(
  config: StateCreator<T, M>,
  options?: {
    key?: string
    debounceMs?: number
  }
) => StateCreator<T & AutoSaveState, M>

export const autoSaveMiddleware: AutoSaveMiddleware = (config, options = {}) => {
  const { key = 'cura-doctor-autosave', debounceMs = 1000 } = options

  return (set, get, api) => {
    const debouncedSave = (() => {
      let timeout: NodeJS.Timeout
      return (state: FormSlice) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          try {
            localStorage.setItem(key, JSON.stringify({
              forms: {
                labResultForm: state.labResultForm,
                vaccinationForm: state.vaccinationForm,
                prescriptionRenewalForm: state.prescriptionRenewalForm,
                labIntegrationForm: state.labIntegrationForm,
              },
              lastSavedAt: new Date().toISOString(),
            }))
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }, debounceMs)
      }
    })()

    // Load from localStorage on initialization
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        return config(
          set as any,
          {
            ...get(),
            forms: data.forms,
            _lastSavedAt: data.lastSavedAt ? new Date(data.lastSavedAt) : null,
            _hasUnsavedChanges: false,
          } as any,
          api
        )
      }
    } catch (error) {
      console.error('Failed to load auto-save data:', error)
    }

    const configuredStore = config(set, get, api)

    return {
      ...configuredStore,
      _hasUnsavedChanges: false,
      _lastSavedAt: null,
      setLabResultForm: (form: Partial<FormSlice['labResultForm']>) => {
        configuredStore.setLabResultForm(form)
        debouncedSave(get() as FormSlice)
      },
      setVaccinationForm: (form: Partial<FormSlice['vaccinationForm']>) => {
        configuredStore.setVaccinationForm(form)
        debouncedSave(get() as FormSlice)
      },
      setPrescriptionRenewalForm: (form: Partial<FormSlice['prescriptionRenewalForm']>) => {
        configuredStore.setPrescriptionRenewalForm(form)
        debouncedSave(get() as FormSlice)
      },
      setLabIntegrationForm: (form: Partial<FormSlice['labIntegrationForm']>) => {
        configuredStore.setLabIntegrationForm(form)
        debouncedSave(get() as FormSlice)
      },
    }
  }
}
