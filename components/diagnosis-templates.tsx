import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Sparkles } from 'lucide-react'

interface DiagnosisTemplate {
  id: string
  name: string
  diagnosis: string
  treatmentPlan: string
  clinicalNotes?: string
}

const DEFAULT_TEMPLATES: DiagnosisTemplate[] = [
  {
    id: 'common-cold',
    name: 'نزلات البرد',
    diagnosis: 'التهاب الجهاز التنفسي العلوي (نزلة برد)',
    treatmentPlan: 'راحة تامة - شرب السوائل بكثرة - مسكنات للألم (باراسيتامول) - مضادات الاحتقان الأنفية - مراقبة الحرارة',
    clinicalNotes: 'لا يوجد مضاعفات خطيرة - يوصى بالراحة في المنزل'
  },
  {
    id: 'sore-throat',
    name: 'التهاب الحلق',
    diagnosis: 'التهاب البلعوم الحاد',
    treatmentPlan: 'غرغرة بماء دافئ وملح - مسكنات للألم - مضادات الالتهاب - تجنب الأطعمة الحارة والحامضة',
    clinicalNotes: 'فحص الحلق - التأكد من عدم وجود خراج'
  },
  {
    id: 'hypertension',
    name: 'ارتفاع ضغط الدم',
    diagnosis: 'ارتفاع ضغط الدم الأساسي',
    treatmentPlan: 'تعديل نمط الحياة - تقليل الملح - ممارسة الرياضة - أدوية خافضة للضغط حسب الحاجة',
    clinicalNotes: 'مراقبة ضغط الدم يومياً - فحص وظائف الكلى دورياً'
  },
  {
    id: 'type2-diabetes',
    name: 'سكري النوع 2',
    diagnosis: 'سكري النوع 2',
    treatmentPlan: 'نظام غذائي منخفض السكر - ممارسة الرياضة - أدوية خافضة للسكر (ميتفورمين) - مراقبة السكر بانتظام',
    clinicalNotes: 'فحص HbA1c كل 3 أشهر - فحص العيون والكلى دورياً'
  },
  {
    id: 'gastritis',
    name: 'التهاب المعدة',
    diagnosis: 'التهاب المعدة الحاد',
    treatmentPlan: 'مضادات الحموضة - مثبطات مضخة البروتون - تجنب الأطعمة الحارة والدهنية - وجبات صغيرة متعددة',
    clinicalNotes: 'فحص بكتيري هيليكوباكتر إذا لزم الأمر'
  }
]

interface DiagnosisTemplatesProps {
  onApplyTemplate: (template: DiagnosisTemplate) => void
}

export function DiagnosisTemplates({ onApplyTemplate }: DiagnosisTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const handleApply = () => {
    const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate)
    if (template) {
      onApplyTemplate(template)
      setSelectedTemplate('')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="اختر قالب تشخيص" />
        </SelectTrigger>
        <SelectContent>
          {DEFAULT_TEMPLATES.map(template => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {template.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={handleApply}
        disabled={!selectedTemplate}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        تطبيق
      </Button>
    </div>
  )
}
