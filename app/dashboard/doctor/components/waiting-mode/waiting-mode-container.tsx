import { WaitingListBar } from '@/components/waiting-list-bar'
import { PatientContextBar } from '@/components/patient-context-bar'

interface WaitingModeContainerProps {
  waitingPatients: any[]
  inProgressAppointments?: any[]
  onStartExam: (appointment: any) => void
  onPatientSelect?: (appointment: any) => void
  patientData: any
  nextPatientData?: any
  isPrescriptionStepOpen: boolean
}

export function WaitingModeContainer({
  waitingPatients,
  inProgressAppointments = [],
  onStartExam,
  onPatientSelect,
  patientData,
  nextPatientData,
  isPrescriptionStepOpen,
}: WaitingModeContainerProps) {
  return (
    <>
      {/* Left Column - Waiting List (25%) */}
      <div className="lg:col-span-3 order-2 lg:order-1">
        <WaitingListBar
          waitingPatients={waitingPatients}
          inProgressAppointments={inProgressAppointments}
          onStartExam={onStartExam}
          onPatientSelect={onPatientSelect}
          nextPatientData={nextPatientData}
        />
      </div>

      {/* Right Column - Patient Context Bar (75%) */}
      <div className="lg:col-span-9 order-1 lg:order-2 flex flex-col overflow-hidden">
        {patientData ? (
          <div className="lg:sticky lg:top-0 lg:self-start overflow-y-auto">
            <PatientContextBar patientData={patientData} isPrescriptionStepOpen={isPrescriptionStepOpen} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-600 mb-2">اختر مريضاً من قائمة الانتظار</p>
              <p className="text-sm text-gray-500">
                سيظهر هنا معلومات المريض عند الاختيار
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
