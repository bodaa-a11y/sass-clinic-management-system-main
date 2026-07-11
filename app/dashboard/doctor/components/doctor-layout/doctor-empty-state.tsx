import { Stethoscope } from 'lucide-react'

export function DoctorEmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Stethoscope className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          اختر مريضاً لبدء الفحص
        </h3>
        <p className="text-gray-500">
          من قائمة المرضى المنتظرين على اليمين
        </p>
      </div>
    </div>
  )
}
