'use client'

import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button-redesigned'
import { useState } from 'react'
import { MedicalRecord } from '../hooks/use-medical-records'

interface MedicalRecordsExportProps {
  records: MedicalRecord[]
  patientName: string
}

export function MedicalRecordsExport({ records, patientName }: MedicalRecordsExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = async () => {
    setIsExporting(true)
    
    try {
      // In a real implementation, you would use jsPDF or react-pdf
      // For now, we'll create a simple text-based export
      const content = generateExportContent(records, patientName)
      
      // Create a blob and download
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medical-records-${patientName}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const generateExportContent = (records: MedicalRecord[], patientName: string): string => {
    let content = `سجلات طبية - ${patientName}\n`
    content += `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}\n`
    content += `${'='.repeat(50)}\n\n`

    records.forEach((record, index) => {
      content += `السجل ${index + 1}\n`
      content += `التاريخ: ${record.visitDate}\n`
      content += `الشكوى الرئيسية: ${record.chiefComplaint}\n`
      content += `التشخيص: ${record.diagnosis}\n`
      content += `الأعراض: ${record.symptoms || 'غير محدد'}\n`
      content += `خطة العلاج: ${record.treatmentPlan}\n`
      content += `ملاحظات سريرية: ${record.clinicalNotes || 'لا توجد'}\n`
      content += `علامات حيوية: ${record.vitalSigns || 'غير محددة'}\n`
      content += `${'-'.repeat(30)}\n\n`
    })

    return content
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToPDF}
      disabled={isExporting || records.length === 0}
    >
      <FileText className="h-4 w-4 mr-2" />
      {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
    </Button>
  )
}
