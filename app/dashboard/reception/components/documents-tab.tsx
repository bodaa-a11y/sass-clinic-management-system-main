'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { FileText, Upload, Search, Download, Eye, Check, X } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

interface MedicalDocument {
  id: string
  patientId: string
  patientName: string
  documentType: 'prescription' | 'lab-result' | 'x-ray' | 'mri' | 'ct-scan' | 'ultrasound' | 'insurance' | 'other'
  title: string
  description?: string
  status: 'pending' | 'verified' | 'rejected'
  createdAt: string
}

interface DocumentsTabProps {
  documents: MedicalDocument[]
  onUpload: (data: any) => void
}

export function DocumentsTab({ documents, onUpload }: DocumentsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [documentForm, setDocumentForm] = useState({
    patientId: '',
    patientName: '',
    documentType: 'other' as 'prescription' | 'lab-result' | 'x-ray' | 'mri' | 'insurance' | 'other',
    title: '',
    description: ''
  })

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter
    return matchesSearch && matchesType
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'pending': { label: 'قيد المراجعة', className: 'bg-yellow-100 text-yellow-700' },
      'verified': { label: 'موثق', className: 'bg-green-100 text-green-700' },
      'rejected': { label: 'مرفوض', className: 'bg-red-100 text-red-700' }
    }
    const config = statusMap[status] || statusMap['pending']
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'prescription': 'وصفة طبية',
      'lab-result': 'نتيجة فحص',
      'x-ray': 'أشعة سينية',
      'mri': 'رنين مغناطيسي',
      'ct-scan': 'تصوير مقطعي',
      'ultrasound': 'موجات صوتية',
      'insurance': 'تأمين',
      'other': 'أخرى'
    }
    return typeMap[type] || type
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    onUpload(documentForm)
    setDocumentForm({ patientId: '', patientName: '', documentType: 'other', title: '', description: '' })
    setIsDialogOpen(false)
    toast.success('تم رفع المستند بنجاح')
  }

  return (
    <SlideIn direction="up" delay={0.4}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الوثائق</h2>
            <p className="text-sm text-gray-500 mt-1">رفع وإدارة الوثائق الطبية</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <HoverScale>
                <Button>
                  <Upload className="w-4 h-4 ml-2" />
                  رفع مستند
                </Button>
              </HoverScale>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع مستند جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="patientName">اسم المريض</Label>
                  <Input
                    id="patientName"
                    value={documentForm.patientName}
                    onChange={(e) => setDocumentForm({ ...documentForm, patientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="documentType">نوع المستند</Label>
                  <Select value={documentForm.documentType} onValueChange={(value: any) => setDocumentForm({ ...documentForm, documentType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prescription">وصفة طبية</SelectItem>
                      <SelectItem value="lab-result">نتيجة فحص</SelectItem>
                      <SelectItem value="x-ray">أشعة سينية</SelectItem>
                      <SelectItem value="mri">رنين مغناطيسي</SelectItem>
                      <SelectItem value="ct-scan">تصوير مقطعي</SelectItem>
                      <SelectItem value="ultrasound">موجات صوتية</SelectItem>
                      <SelectItem value="insurance">تأمين</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">عنوان المستند</Label>
                  <Input
                    id="title"
                    value={documentForm.title}
                    onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">وصف</Label>
                  <Textarea
                    id="description"
                    value={documentForm.description}
                    onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">رفع المستند</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث عن مستند..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="prescription">وصفة طبية</SelectItem>
              <SelectItem value="lab-result">نتيجة فحص</SelectItem>
              <SelectItem value="x-ray">أشعة سينية</SelectItem>
              <SelectItem value="insurance">تأمين</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">لا توجد وثائق</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    {getStatusBadge(doc.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-600">
                      المريض: {doc.patientName}
                    </div>
                    <div className="text-gray-500">
                      النوع: {getDocumentTypeLabel(doc.documentType)}
                    </div>
                    {doc.description && (
                      <div className="text-gray-500 text-xs">
                        {doc.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 ml-1" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SlideIn>
  )
}
