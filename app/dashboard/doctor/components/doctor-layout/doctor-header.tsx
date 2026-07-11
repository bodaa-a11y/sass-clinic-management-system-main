import { Stethoscope } from 'lucide-react'

interface DoctorHeaderProps {
  isExamMode: boolean
  patientName?: string
  facilityType?: string
}

export function DoctorHeader({ isExamMode, patientName, facilityType }: DoctorHeaderProps) {
  return (
    <div className="bg-white border-b px-6 py-4">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Stethoscope className="w-7 h-7 text-blue-700" />
        {isExamMode ? `فحص - ${patientName}` : (facilityType === 'single_clinic' ? 'عيادة الطبيب' : 'غرفة الطبيب')}
      </h1>
      <p className="text-slate-600 mt-1 text-sm font-light">
        {isExamMode ? 'جاري الفحص الطبي' : (
          <>
            {facilityType === 'single_clinic' && 'عيادة طبيب واحد'}
            {facilityType === 'multi_clinic' && 'عيادة متعددة أطباء'}
            {facilityType === 'medical_center' && 'مركز طبي'}
            {' • إدارة الفحوصات والمرضى المنتظرين'}
          </>
        )}
      </p>
    </div>
  )
}
