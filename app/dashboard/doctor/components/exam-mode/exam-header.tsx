import { Button } from '@/components/ui/button-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { X, Save, Clock, CheckCircle } from 'lucide-react'

interface ExamHeaderProps {
  patientName: string
  onClose: () => void
  currentStep?: number
  totalSteps?: number
  isAutoSaving?: boolean
  lastSaved?: string
}

export function ExamHeader({ 
  patientName, 
  onClose, 
  currentStep = 1, 
  totalSteps = 5,
  isAutoSaving = false,
  lastSaved
}: ExamHeaderProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">فحص: {patientName}</h2>
          <div className="flex items-center gap-3 mt-2">
            {/* Progress Bar */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>المرحلة {currentStep} من {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {/* Auto-save Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {isAutoSaving ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Save className="w-3 h-3 animate-spin" />
                  جاري الحفظ...
                </Badge>
              ) : lastSaved ? (
                <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3" />
                  محفوظ {lastSaved}
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  حفظ تلقائي
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="w-5 h-5 ml-2" />
          إغلاق الفحص
        </Button>
      </div>
    </div>
  )
}
