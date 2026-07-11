import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button-redesigned'
import { AlertTriangle } from 'lucide-react'

interface ExamExitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (save: boolean) => void
}

export function ExamExitDialog({ open, onOpenChange, onConfirm }: ExamExitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            تأكيد إغلاق الفحص
          </DialogTitle>
          <DialogDescription className="text-right">
            هل أنت متأكد من أنك تريد إغلاق الفحص؟
            <br />
            <span className="text-amber-600 font-medium">
              أي بيانات غير محفوظة قد تضيع.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row-reverse gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(false)}
          >
            إغلاق بدون حفظ
          </Button>
          <Button onClick={() => onConfirm(true)}>
            حفظ ومتابعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
