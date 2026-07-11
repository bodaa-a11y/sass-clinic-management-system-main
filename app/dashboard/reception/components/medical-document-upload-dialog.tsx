'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button-redesigned'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface MedicalDocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (data: { patientId: string; documentType: string; title: string; description?: string; file?: File; textContent?: string }) => Promise<void>
  patients: Array<{ id: string; name: string }>
}

export function MedicalDocumentUploadDialog({ open, onOpenChange, onUpload, patients }: MedicalDocumentUploadDialogProps) {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [textContent, setTextContent] = useState('')
  const [patientId, setPatientId] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [inputType, setInputType] = useState<'file' | 'text'>('file')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !documentType || !title) return
    if (inputType === 'file' && !file) return
    if (inputType === 'text' && !textContent) return

    setIsUploading(true)
    try {
      await onUpload({
        patientId,
        documentType,
        title,
        description,
        file: inputType === 'file' ? file : undefined,
        textContent: inputType === 'text' ? textContent : undefined,
      })
      // Reset form
      setFile(undefined)
      setTextContent('')
      setPatientId('')
      setDocumentType('')
      setTitle('')
      setDescription('')
      setInputType('file')
      onOpenChange(false)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFile(undefined)
      setTextContent('')
      setPatientId('')
      setDocumentType('')
      setTitle('')
      setDescription('')
      setInputType('file')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>رفع مستند طبي</DialogTitle>
          <DialogDescription>
            اختر المريض ونوع المستند، ثم ارفع ملف أو اكتب نصاً
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">المريض *</Label>
              <Select value={patientId} onValueChange={setPatientId} disabled={isUploading} required>
                <SelectTrigger id="patient">
                  <SelectValue placeholder="اختر المريض" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inputType">نوع الإدخال *</Label>
              <Select value={inputType} onValueChange={(value: 'file' | 'text') => setInputType(value)} disabled={isUploading}>
                <SelectTrigger id="inputType">
                  <SelectValue placeholder="اختر نوع الإدخال" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">رفع ملف</SelectItem>
                  <SelectItem value="text">كتابة نص</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inputType === 'file' ? (
              <div className="space-y-2">
                <Label htmlFor="fileInput">الملف *</Label>
                <Input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {file && (
                  <p className="text-sm text-gray-500">
                    الملف المحدد: {file.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="textContent">النص *</Label>
                <Textarea
                  id="textContent"
                  placeholder="اكتب المحتوى هنا..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={isUploading}
                  rows={5}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="documentType">نوع المستند *</Label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading} required>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="اختر نوع المستند" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescription">وصفة طبية</SelectItem>
                  <SelectItem value="lab-result">نتيجة مختبر</SelectItem>
                  <SelectItem value="x-ray">أشعة سينية</SelectItem>
                  <SelectItem value="mri">رنين مغناطيسي</SelectItem>
                  <SelectItem value="ct-scan">أشعة CT</SelectItem>
                  <SelectItem value="ultrasound">موجات صوتية</SelectItem>
                  <SelectItem value="insurance">تأمين</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                placeholder="مثال: فحص دم شامل"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="وصف اختياري للمستند..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={!patientId || !documentType || !title || isUploading || (inputType === 'file' ? !file : !textContent)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                'رفع المستند'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
