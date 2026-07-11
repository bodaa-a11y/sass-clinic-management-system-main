'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MedicalExamWizard } from '@/components/medical-exam-wizard'
import { CompactLabResultsTable } from '@/components/compact-lab-results-table'
import { RadiologyImageCard } from '../labs/radiology-image-card'
import { RadiologyLightbox } from '../labs/radiology-lightbox'
import { RadiologyUploadDialog } from '../dialogs/radiology-upload-dialog'
import { MedicalDocumentUploadDialog } from '@/app/dashboard/reception/components/medical-document-upload-dialog'
import { useRadiology } from '../../hooks/use-radiology'
import { useMedicalDocuments } from '../../hooks/use-medical-documents'
import { useDoctorStore } from '../../stores/doctor-store'
import { FileText, Loader2 } from 'lucide-react'

interface ExamTabsProps {
  patientName: string
  patientId: string
  clinicId?: string
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  onStepChange: (step: number) => void
  labResults?: any[]
  onAddLabResult: () => void
  isPrescriptionStepOpen: boolean
}

export function ExamTabs({
  patientName,
  patientId,
  clinicId,
  onSubmit,
  onCancel,
  onStepChange,
  labResults,
  onAddLabResult,
  isPrescriptionStepOpen,
}: ExamTabsProps) {
  const { clinicId: storeClinicId } = useDoctorStore()
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isDocumentUploadDialogOpen, setIsDocumentUploadDialogOpen] = useState(false)
  const [documentFilter, setDocumentFilter] = useState<string>('all')

  const {
    images,
    isLoading: radiologyLoading,
    selectedImage,
    isLightboxOpen,
    fetchRadiologyImages,
    handleImageClick,
    handleCloseLightbox,
    uploadRadiologyImage,
  } = useRadiology()

  const {
    documents: medicalDocuments,
    isLoading: documentsLoading,
    fetchMedicalDocuments,
  } = useMedicalDocuments()

  // Fetch radiology images when patient changes
  useEffect(() => {
    if (patientId) {
      fetchRadiologyImages(patientId)
      fetchMedicalDocuments(patientId)
    }
  }, [patientId, fetchRadiologyImages, fetchMedicalDocuments])

  const handleUpload = async (file: File, metadata: { title: string; type: string; description?: string }) => {
    await uploadRadiologyImage(patientId, file, metadata)
  }

  const handleUploadDocument = async (data: { patientId: string; documentType: string; title: string; description?: string; file?: File; textContent?: string }) => {
    if (!storeClinicId) return
    try {
      const formData = new FormData()
      formData.append('patientId', data.patientId)
      formData.append('documentType', data.documentType)
      formData.append('title', data.title)
      if (data.description) {
        formData.append('description', data.description)
      }
      if (data.file) {
        formData.append('file', data.file)
      }
      if (data.textContent) {
        formData.append('textContent', data.textContent)
      }

      const response = await fetch(`/api/clinics/${storeClinicId}/medical-documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        fetchMedicalDocuments(patientId)
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
    }
  }

  const handleApproveDocument = async (doc: any) => {
    if (!storeClinicId) return
    try {
      const response = await fetch(`/api/clinics/${storeClinicId}/medical-documents/${doc.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'verified',
          documentType: doc.documentType,
        }),
      })
      if (response.ok) {
        fetchMedicalDocuments(patientId)
      }
    } catch (error) {
      console.error('Failed to approve document:', error)
    }
  }

  const handleRejectDocument = async (doc: any) => {
    if (!storeClinicId) return
    const reason = prompt('سبب الرفض:')
    if (!reason) return
    try {
      const response = await fetch(`/api/clinics/${storeClinicId}/medical-documents/${doc.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          documentType: doc.documentType,
          rejectionReason: reason,
        }),
      })
      if (response.ok) {
        fetchMedicalDocuments(patientId)
      }
    } catch (error) {
      console.error('Failed to reject document:', error)
    }
  }

  return (
    <Tabs defaultValue="examination" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4 bg-white">
        <TabsTrigger value="examination">التشخيص</TabsTrigger>
        <TabsTrigger value="labs">المختبرات</TabsTrigger>
        <TabsTrigger value="radiology">الأشعة</TabsTrigger>
        <TabsTrigger value="documents">المستندات</TabsTrigger>
      </TabsList>

      <TabsContent value="examination">
        <MedicalExamWizard
          patientName={patientName}
          patientId={patientId}
          clinicId={clinicId}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={false}
          onStepChange={onStepChange}
        />
      </TabsContent>

      <TabsContent value="labs">
        <CompactLabResultsTable
          results={labResults?.map(r => ({
            id: r.id,
            testName: r.testName,
            testType: r.testType,
            result: r.result,
            normalRange: r.normalRange,
            status: r.status as 'completed' | 'pending',
            testDate: r.testDate || new Date().toISOString()
          })) || []}
          onAddResult={onAddLabResult}
        />
      </TabsContent>

      <TabsContent value="radiology">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">صور الأشعة</h3>
          <button
            onClick={() => setIsUploadDialogOpen(true)}
            className="px-3 py-1.5 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
          >
            + رفع صورة
          </button>
        </div>

        {radiologyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد صور أشعة
            </h3>
            <p className="text-gray-500">
              لم يتم رفع أي صور أشعة لهذا المريض بعد
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <RadiologyImageCard
                key={image.id}
                image={image}
                onClick={handleImageClick}
              />
            ))}
          </div>
        )}

        {selectedImage && (
          <RadiologyLightbox
            open={isLightboxOpen}
            onOpenChange={handleCloseLightbox}
            imageUrl={selectedImage.imageUrl}
            imageTitle={selectedImage.title}
            imageType={selectedImage.type}
            imageDate={selectedImage.studyDate}
          />
        )}

        <RadiologyUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUpload={handleUpload}
        />
      </TabsContent>

      <TabsContent value="documents">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Select value={documentFilter} onValueChange={setDocumentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="فلترة الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="verified">تم التحقق</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setIsDocumentUploadDialogOpen(true)}>
              رفع مستند
            </Button>
          </div>

          {documentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : medicalDocuments && medicalDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {medicalDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Badge variant={doc.status === 'verified' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {doc.status === 'pending' ? 'قيد المراجعة' : doc.status === 'verified' ? 'تم التحقق' : 'مرفوض'}
                          </Badge>
                          <span className="text-sm">
                            {doc.documentType === 'prescription' ? 'وصفة طبية' :
                             doc.documentType === 'lab-result' ? 'نتيجة مختبر' :
                             doc.documentType === 'x-ray' ? 'أشعة سينية' :
                             doc.documentType === 'mri' ? 'رنين مغناطيسي' :
                             doc.documentType === 'ct-scan' ? 'أشعة CT' :
                             doc.documentType === 'ultrasound' ? 'موجات صوتية' :
                             doc.documentType === 'insurance' ? 'تأمين' : 'أخرى'}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                        {doc.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">سبب الرفض: {doc.rejectionReason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleApproveDocument(doc)}>
                              موافقة
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectDocument(doc)}>
                              رفض
                            </Button>
                          </>
                        )}
                        {(doc.url || doc.fileUrl || doc.imageUrl) && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.url || doc.fileUrl || doc.imageUrl} target="_blank" rel="noopener noreferrer">
                              عرض
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد مستندات
              </h3>
              <p className="text-gray-500">
                لم يتم رفع أي مستندات طبية لهذا المريض بعد
              </p>
            </div>
          )}
        </div>

        <MedicalDocumentUploadDialog
          open={isDocumentUploadDialogOpen}
          onOpenChange={setIsDocumentUploadDialogOpen}
          onUpload={handleUploadDocument}
          patients={[{ id: patientId, name: patientName }]}
        />
      </TabsContent>
    </Tabs>
  )
}
