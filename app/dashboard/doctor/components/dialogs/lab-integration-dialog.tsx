import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LabIntegrationForm } from '../../types/lab.types'

interface LabIntegrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: LabIntegrationForm
  onFormChange: (data: Partial<LabIntegrationForm>) => void
  onSubmit: (e: React.FormEvent) => void
}

export function LabIntegrationDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
}: LabIntegrationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة تكامل مختبر جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="labName">اسم المختبر *</Label>
            <Input
              id="labName"
              value={formData.labName}
              onChange={(e) => onFormChange({ labName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="labType">نوع المختبر *</Label>
            <select
              id="labType"
              value={formData.labType}
              onChange={(e) => onFormChange({ labType: e.target.value as 'internal' | 'external' })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="internal">داخلي</option>
              <option value="external">خارجي</option>
            </select>
          </div>
          {formData.labType === 'external' && (
            <>
              <div>
                <Label htmlFor="apiEndpoint">رابط API *</Label>
                <Input
                  id="apiEndpoint"
                  value={formData.apiEndpoint}
                  onChange={(e) => onFormChange({ apiEndpoint: e.target.value })}
                  placeholder="https://api.lab-example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="apiKey">مفتاح API *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => onFormChange({ apiKey: e.target.value })}
                  required
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="supportedTests">الفحوصات المدعومة</Label>
            <Textarea
              id="supportedTests"
              value={formData.supportedTests.join(', ')}
              onChange={(e) => onFormChange({ supportedTests: e.target.value.split(', ').filter(Boolean) })}
              placeholder="مثال: CBC, Lipid Panel, Glucose"
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
