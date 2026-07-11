import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PrescriptionRenewalForm } from '../../types/lab.types'

interface PrescriptionRenewalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: PrescriptionRenewalForm
  onFormChange: (data: Partial<PrescriptionRenewalForm>) => void
  onSubmit: (e: React.FormEvent) => void
}

export function PrescriptionRenewalDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
}: PrescriptionRenewalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>طلب تجديد وصفة طبية</DialogTitle>
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
            <Label htmlFor="medicationName">اسم الدواء *</Label>
            <Input
              id="medicationName"
              value={formData.medicationName}
              onChange={(e) => onFormChange({ medicationName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="dosage">الجرعة *</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => onFormChange({ dosage: e.target.value })}
              placeholder="مثال: 500mg"
              required
            />
          </div>
          <div>
            <Label htmlFor="frequency">التكرار *</Label>
            <Input
              id="frequency"
              value={formData.frequency}
              onChange={(e) => onFormChange({ frequency: e.target.value })}
              placeholder="مثال: مرتين يومياً"
              required
            />
          </div>
          <div>
            <Label htmlFor="originalPrescriptionDate">تاريخ الوصفة الأصلية *</Label>
            <Input
              id="originalPrescriptionDate"
              type="date"
              value={formData.originalPrescriptionDate}
              onChange={(e) => onFormChange({ originalPrescriptionDate: e.target.value })}
              required
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
            <Button type="submit">إرسال الطلب</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
