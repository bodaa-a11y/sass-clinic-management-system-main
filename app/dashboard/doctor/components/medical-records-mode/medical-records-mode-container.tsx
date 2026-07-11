import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, FileText, Calendar, Stethoscope } from 'lucide-react'
import { useMedicalRecords, MedicalRecord } from '../../hooks/use-medical-records'
import { useDoctorStore } from '../../stores/doctor-store'
import { MedicalRecordsSearch } from '../medical-records-search'
import { MedicalRecordsFilter, FilterState } from '../medical-records-filter'
import { MedicalRecordsExport } from '../medical-records-export'
import { VisitComparison } from '../visit-comparison'
import { useState } from 'react'

interface MedicalRecordsModeContainerProps {
  patientName: string
  patientId: string
  onClose: () => void
}

export function MedicalRecordsModeContainer({
  patientName,
  patientId,
  onClose,
}: MedicalRecordsModeContainerProps) {
  const { records, isLoading, error } = useMedicalRecords(patientId)
  const selectedMedicalRecordId = useDoctorStore((state) => state.selectedMedicalRecordId)
  const setSelectedMedicalRecordId = useDoctorStore((state) => state.setSelectedMedicalRecordId)

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    visitType: '',
    doctor: '',
  })

  const selectedRecord = records.find(r => r.id === selectedMedicalRecordId)

  // Filter records based on search and filters
  const filteredRecords = records.filter(record => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        record.diagnosis?.toLowerCase().includes(query) ||
        record.symptoms?.toLowerCase().includes(query) ||
        record.clinicalNotes?.toLowerCase().includes(query) ||
        record.chiefComplaint?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Date filter
    if (filters.dateFrom && new Date(record.visitDate) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(record.visitDate) > new Date(filters.dateTo)) return false

    // Doctor filter
    if (filters.doctor && filters.doctor !== 'all' && record.doctorId !== filters.doctor) return false

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-700" />
            السجلات الطبية
          </h2>
          <p className="text-sm text-gray-600 mt-1">المريض: {patientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <MedicalRecordsExport 
            records={filteredRecords} 
            patientName={patientName}
          />
          <Button variant="outline" onClick={onClose}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <MedicalRecordsSearch 
          onSearch={setSearchQuery}
          placeholder="ابحث في التشخيص، الأعراض، الملاحظات..."
        />
        <MedicalRecordsFilter onFilterChange={setFilters} />
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <p className="mt-4 text-gray-600">جاري تحميل السجلات...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredRecords.length === 0 && records.length > 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">لا توجد سجلات تطابق البحث أو الفلترة</p>
        </div>
      )}

      {!isLoading && !error && records.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">لا توجد سجلات طبية لهذا المريض</p>
        </div>
      )}

      {!isLoading && !error && filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Records List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">السجلات ({filteredRecords.length})</h3>
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedRecord?.id === record.id ? 'ring-2 ring-blue-700' : ''
                }`}
                onClick={() => setSelectedMedicalRecordId(record.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(record.visitDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-1 line-clamp-1">
                        {record.diagnosis}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {record.chiefComplaint}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Record Details */}
          {selectedRecord && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  تفاصيل السجل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">تاريخ الزيارة</label>
                  <p className="mt-1">{new Date(selectedRecord.visitDate).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">الشكوى الرئيسية</label>
                  <p className="mt-1">{selectedRecord.chiefComplaint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">التشخيص</label>
                  <p className="mt-1">{selectedRecord.diagnosis}</p>
                </div>
                {selectedRecord.symptoms && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">الأعراض</label>
                    <p className="mt-1">{selectedRecord.symptoms}</p>
                  </div>
                )}
                {selectedRecord.clinicalNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">الملاحظات السريرية</label>
                    <p className="mt-1">{selectedRecord.clinicalNotes}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">خطة العلاج</label>
                  <p className="mt-1">{selectedRecord.treatmentPlan}</p>
                </div>
                {selectedRecord.vitalSigns && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">العلامات الحيوية</label>
                    <p className="mt-1">{selectedRecord.vitalSigns}</p>
                  </div>
                )}
                {selectedRecord.followUpDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">تاريخ المتابعة</label>
                    <p className="mt-1">{new Date(selectedRecord.followUpDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Visit Comparison */}
          {filteredRecords.length > 1 && (
            <div className="lg:col-span-2">
              <VisitComparison visits={filteredRecords.map(record => ({
                id: record.id,
                date: record.visitDate,
                diagnosis: record.diagnosis,
                symptoms: record.symptoms || '',
                bloodPressure: record.vitalSigns?.split('\n')[0] || 'غير محدد',
                heartRate: record.vitalSigns?.split('\n')[1] || 'غير محدد',
                weight: record.vitalSigns?.split('\n')[2] || 'غير محدد',
                notes: record.clinicalNotes || '',
              }))} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
