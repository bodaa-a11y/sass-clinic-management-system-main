'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge-redesigned'
import { Button } from '@/components/ui/button'
import { 
  User, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon, 
  Microscope,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface PatientSidebarProps {
  patientData: any
  labResults?: any[]
  radiologyImages?: any[]
  medicalDocuments?: any[]
  onAddLabResult?: () => void
  onAddRadiology?: () => void
  onAddDocument?: () => void
}

export function PatientSidebar({
  patientData,
  labResults = [],
  radiologyImages = [],
  medicalDocuments = [],
  onAddLabResult,
  onAddRadiology,
  onAddDocument,
}: PatientSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('patient')

  const { patient, medicalRecords, stats } = patientData || {}

  // Calculate age
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = patient ? calculateAge(patient.dateOfBirth) : null

  // Parse allergies
  const hasAllergies = patient?.allergies && patient.allergies.trim().length > 0
  const allergiesList = hasAllergies ? (patient!.allergies || '').split(',').map((a: string) => a.trim()) : []

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="h-full overflow-y-auto bg-white border-l rounded-lg">
      <div className="p-4 space-y-4">
        {/* Patient Info Card */}
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-blue-700" />
              معلومات المريض
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-bold text-lg">{patient?.fullName}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                {age && <span>{age} سنة</span>}
                {patient?.phone && <span>• {patient.phone}</span>}
              </div>
            </div>

            {hasAllergies && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  حساسية
                </div>
                <div className="flex flex-wrap gap-1">
                  {allergiesList.map((allergy: string, idx: number) => (
                    <Badge key={idx} className="bg-red-100 text-red-900 text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {stats?.lastVisitDate && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">آخر زيارة:</span>{' '}
                {new Date(stats.lastVisitDate).toLocaleDateString('ar-SA')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Accordion for Labs, Radiology, Documents */}
        <div className="space-y-3">
          {/* Lab Results */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('labs')}
              className="w-full flex items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Microscope className="w-4 h-4 text-blue-700" />
              <span className="font-medium text-blue-900">المختبرات</span>
              <Badge variant="secondary" className="mr-auto bg-blue-200 text-blue-800">
                {labResults.length}
              </Badge>
              {expandedSection === 'labs' ? (
                <ChevronUp className="w-4 h-4 text-blue-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-700" />
              )}
            </button>
            {expandedSection === 'labs' && (
              <div className="p-4 pt-2 space-y-2 bg-white">
                {labResults.length === 0 ? (
                  <div className="text-center py-4">
                    <Microscope className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">لا توجد نتائج مختبر</p>
                  </div>
                ) : (
                  labResults.map((lab: any) => (
                    <div key={lab.id} className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">{lab.testName}</p>
                        <Badge variant={lab.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {lab.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{lab.testType}</p>
                      <p className="text-xs text-gray-400">{lab.testDate}</p>
                      {lab.result && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600"><span className="font-medium">النتيجة:</span> {lab.result}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {onAddLabResult && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={onAddLabResult}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة نتيجة
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Radiology */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('radiology')}
              className="w-full flex items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-purple-700" />
              <span className="font-medium text-purple-900">الأشعة</span>
              <Badge variant="secondary" className="mr-auto bg-purple-200 text-purple-800">
                {radiologyImages.length}
              </Badge>
              {expandedSection === 'radiology' ? (
                <ChevronUp className="w-4 h-4 text-purple-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-700" />
              )}
            </button>
            {expandedSection === 'radiology' && (
              <div className="p-4 pt-2 space-y-2 bg-white">
                {radiologyImages.length === 0 ? (
                  <div className="text-center py-4">
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">لا توجد صور أشعة</p>
                  </div>
                ) : (
                  radiologyImages.map((image: any) => (
                    <div key={image.id} className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        {image.imageUrl && (
                          <div className="w-16 h-16 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                            <img
                              src={image.imageUrl}
                              alt={image.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{image.title}</p>
                          <p className="text-xs text-gray-500 mb-1">{image.type}</p>
                          <p className="text-xs text-gray-400">{image.studyDate}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {onAddRadiology && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    onClick={onAddRadiology}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة صورة
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('documents')}
              className="w-full flex items-center gap-2 p-4 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <FileText className="w-4 h-4 text-green-700" />
              <span className="font-medium text-green-900">المستندات</span>
              <Badge variant="secondary" className="mr-auto bg-green-200 text-green-800">
                {medicalDocuments.length}
              </Badge>
              {expandedSection === 'documents' ? (
                <ChevronUp className="w-4 h-4 text-green-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-green-700" />
              )}
            </button>
            {expandedSection === 'documents' && (
              <div className="p-4 pt-2 space-y-2 bg-white">
                {medicalDocuments.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">لا توجد مستندات</p>
                  </div>
                ) : (
                  medicalDocuments.map((doc: any) => (
                    <div key={doc.id} className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <Badge
                          variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {doc.status === 'approved' ? 'معتمد' : doc.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{doc.documentType}</p>
                      <p className="text-xs text-gray-400">{doc.uploadDate}</p>
                      {doc.description && (
                        <p className="text-xs text-gray-600 mt-2">{doc.description}</p>
                      )}
                    </div>
                  ))
                )}
                {onAddDocument && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    onClick={onAddDocument}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة مستند
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
