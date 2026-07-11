import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LabResultForm } from '../../types/lab.types'

interface LabResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: LabResultForm
  onFormChange: (data: Partial<LabResultForm>) => void
  onSubmit: (e: React.FormEvent) => void
}

export function LabResultDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
}: LabResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة نتيجة مختبر جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patientName">اسم المريض *</Label>
            <Input
              id="patientName"
              value={formData.patientName}
              onChange={(e) => onFormChange({ patientName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="testName">اسم الفحص *</Label>
            <Input
              id="testName"
              value={formData.testName}
              onChange={(e) => onFormChange({ testName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="testType">نوع الفحص *</Label>
            <Input
              id="testType"
              value={formData.testType}
              onChange={(e) => onFormChange({ testType: e.target.value })}
              placeholder="مثال: دم، بول، صورة شعاعية"
              required
            />
          </div>
          <div>
            <Label htmlFor="result">النتيجة *</Label>
            <Textarea
              id="result"
              value={formData.result}
              onChange={(e) => onFormChange({ result: e.target.value })}
              required
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="normalRange">النطاق الطبيعي</Label>
            <Input
              id="normalRange"
              value={formData.normalRange}
              onChange={(e) => onFormChange({ normalRange: e.target.value })}
              placeholder="مثال: 70-120"
            />
          </div>
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormChange({ notes: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">إضافة</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
