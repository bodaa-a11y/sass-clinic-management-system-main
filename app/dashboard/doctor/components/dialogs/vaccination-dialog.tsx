import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { VaccinationForm } from '../../types/lab.types'

interface VaccinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: VaccinationForm
  onFormChange: (data: Partial<VaccinationForm>) => void
  onSubmit: (e: React.FormEvent) => void
}

export function VaccinationDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
}: VaccinationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة تطعيم جديد</DialogTitle>
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
            <Label htmlFor="vaccineName">اسم اللقاح *</Label>
            <Input
              id="vaccineName"
              value={formData.vaccineName}
              onChange={(e) => onFormChange({ vaccineName: e.target.value })}
              placeholder="مثال: لقاح الإنفلونزا"
              required
            />
          </div>
          <div>
            <Label htmlFor="vaccineType">نوع اللقاح *</Label>
            <Input
              id="vaccineType"
              value={formData.vaccineType}
              onChange={(e) => onFormChange({ vaccineType: e.target.value })}
              placeholder="مثال: فيروسي، بكتيري"
              required
            />
          </div>
          <div>
            <Label htmlFor="doseNumber">رقم الجرعة *</Label>
            <Input
              id="doseNumber"
              type="number"
              min="1"
              value={formData.doseNumber}
              onChange={(e) => onFormChange({ doseNumber: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div>
            <Label htmlFor="administrationDate">تاريخ الإعطاء *</Label>
            <Input
              id="administrationDate"
              type="date"
              value={formData.administrationDate}
              onChange={(e) => onFormChange({ administrationDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="nextDueDate">تاريخ الجرعة التالية</Label>
            <Input
              id="nextDueDate"
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => onFormChange({ nextDueDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="batchNumber">رقم الدفعة</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) => onFormChange({ batchNumber: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="site">موقع الحقن *</Label>
            <Input
              id="site"
              value={formData.site}
              onChange={(e) => onFormChange({ site: e.target.value })}
              placeholder="مثال: الذراع اليسرى"
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormChange({ notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-md"
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
