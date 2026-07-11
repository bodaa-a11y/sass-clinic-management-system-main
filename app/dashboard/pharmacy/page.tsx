'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-redesigned'
import { toast } from 'sonner'
import { Pill, FileText, Search, Plus, Check, AlertCircle, Package, Edit, Trash2 } from 'lucide-react'
import { useRealtimeData } from '@/lib/use-realtime-data'
import { PageTransition } from '@/components/animations/page-transition';
import { SlideIn } from '@/components/animations/feedback-animations';
import { HoverScale } from '@/components/animations/micro-interactions'

interface Prescription {
  id: string
  medicalRecordId: string
  patientName: string
  doctorName: string
  medications: any[]
  createdAt: string
  status: 'pending' | 'dispensed' | 'cancelled'
}

interface Medication {
  id: string
  name: string
  description: string
  stock: number
  minStock?: number
  price?: number
  expirationDate?: string
  autoReorder?: boolean
  reorderQuantity?: number
  reorderThreshold?: number
  barcode?: string
}

interface BarcodeScan {
  id: string
  medicationId: string
  medicationName: string
  barcode: string
  scanDate: string
  scannedBy: string
  action: 'in' | 'out' | 'check'
  quantity: number
}

interface PharmacyIntegration {
  id: string
  pharmacyName: string
  pharmacyType: 'internal' | 'external'
  apiEndpoint?: string
  apiKey?: string
  status: 'active' | 'inactive'
  supportedMedications: string[]
}

export default function PharmacyPage() {
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lowStockAlerts, setLowStockAlerts] = useState<Medication[]>([])
  const [expiredAlerts, setExpiredAlerts] = useState<Medication[]>([])
  const [reorderAlerts, setReorderAlerts] = useState<Medication[]>([])
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false)
  const [isEditingMedication, setIsEditingMedication] = useState(false)
  const [isBarcodeScanDialogOpen, setIsBarcodeScanDialogOpen] = useState(false)
  const [isPharmacyIntegrationDialogOpen, setIsPharmacyIntegrationDialogOpen] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    description: '',
    stock: 0,
    minStock: 10,
    price: 0,
    expirationDate: '',
    autoReorder: false,
    reorderQuantity: 50,
    reorderThreshold: 20,
    barcode: ''
  })
  const [barcodeScanForm, setBarcodeScanForm] = useState({
    medicationId: '',
    medicationName: '',
    barcode: '',
    action: 'check' as 'in' | 'out' | 'check',
    quantity: 1
  })
  const [pharmacyIntegrationForm, setPharmacyIntegrationForm] = useState({
    pharmacyName: '',
    pharmacyType: 'external' as 'internal' | 'external',
    apiEndpoint: '',
    apiKey: '',
    supportedMedications: [] as string[]
  })

  useEffect(() => {
    const user = store.getUser()
    if (user?.clinicId) {
      setClinicId(user.clinicId)
    }
  }, [])

  const { data: prescriptions, isLoading: prescriptionsLoading } = useRealtimeData<Prescription[]>(
    clinicId ? `/clinics/${clinicId}/prescriptions` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const { data: medications, isLoading: medicationsLoading } = useRealtimeData<Medication[]>(
    clinicId ? `/clinics/${clinicId}/medications` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const { data: barcodeScans, isLoading: barcodeScansLoading, refetch: refetchBarcodeScans } = useRealtimeData<BarcodeScan[]>(
    clinicId ? `/clinics/${clinicId}/barcode-scans` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const { data: pharmacyIntegrations, isLoading: pharmacyIntegrationsLoading, refetch: refetchPharmacyIntegrations } = useRealtimeData<PharmacyIntegration[]>(
    clinicId ? `/clinics/${clinicId}/pharmacy-integrations` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  // Check for expired or expiring medications
  useEffect(() => {
    if (medications) {
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)

      const expired = medications.filter(med => {
        if (!med.expirationDate) return false
        const expDate = new Date(med.expirationDate)
        return expDate <= today
      })
      setExpiredAlerts(expired)
    }
  }, [medications])

  // Check for low stock medications
  useEffect(() => {
    if (medications) {
      const lowStock = medications.filter(med => med.stock < (med.minStock || 10))
      setLowStockAlerts(lowStock)
    }
  }, [medications])

  // Check for medications that need reordering
  useEffect(() => {
    if (medications) {
      const needReorder = medications.filter(med => {
        if (!med.autoReorder) return false
        const threshold = med.reorderThreshold || med.minStock || 10
        return med.stock <= threshold
      })
      setReorderAlerts(needReorder)
    }
  }, [medications])

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/medications`, {
        method: 'POST',
        body: JSON.stringify(medicationForm)
      })

      if (response.ok) {
        toast.success('تم إضافة الدواء بنجاح')
        setMedicationForm({
          name: '',
          description: '',
          stock: 0,
          minStock: 10,
          price: 0,
          expirationDate: '',
          autoReorder: false,
          reorderQuantity: 50,
          reorderThreshold: 10,
          barcode: ''
        })
        setIsMedicationDialogOpen(false)
      } else {
        toast.error('فشل إضافة الدواء')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الدواء')
    }
  }

  const handleEditMedication = (medication: Medication) => {
    setSelectedMedication(medication)
    setMedicationForm({
      name: medication.name,
      description: medication.description,
      stock: medication.stock,
      minStock: medication.minStock || 10,
      price: medication.price || 0,
      expirationDate: medication.expirationDate || '',
      autoReorder: medication.autoReorder || false,
      reorderQuantity: medication.reorderQuantity || 50,
      reorderThreshold: medication.reorderThreshold || 10,
      barcode: medication.barcode || ''
    })
    setIsEditingMedication(true)
    setIsMedicationDialogOpen(true)
  }

  const handleUpdateMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId || !selectedMedication) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/medications/${selectedMedication.id}`, {
        method: 'PUT',
        body: JSON.stringify(medicationForm)
      })

      if (response.ok) {
        toast.success('تم تحديث الدواء بنجاح')
        setMedicationForm({
          name: '',
          description: '',
          stock: 0,
          minStock: 10,
          price: 0,
          expirationDate: '',
          autoReorder: false,
          reorderQuantity: 50,
          reorderThreshold: 10,
          barcode: ''
        })
        setIsMedicationDialogOpen(false)
        setIsEditingMedication(false)
        setSelectedMedication(null)
      } else {
        toast.error('فشل تحديث الدواء')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الدواء')
    }
  }

  const handleDeleteMedication = async (medicationId: string) => {
    if (!clinicId) return

    if (!confirm('هل أنت متأكد من حذف هذا الدواء؟')) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/medications/${medicationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('تم حذف الدواء بنجاح')
      } else {
        toast.error('فشل حذف الدواء')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الدواء')
    }
  }

  const openAddMedicationDialog = () => {
    setMedicationForm({
      name: '',
      description: '',
      stock: 0,
      minStock: 10,
      price: 0,
      expirationDate: '',
      autoReorder: false,
      reorderQuantity: 50,
      reorderThreshold: 10,
      barcode: ''
    })
    setIsEditingMedication(false)
    setSelectedMedication(null)
    setIsMedicationDialogOpen(true)
  }

  const handleDispense = async (prescriptionId: string) => {
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'dispensed' })
      })

      if (response.ok) {
        toast.success('تم صرف الوصفة بنجاح')
      }
    } catch {
      toast.error('فشل صرف الوصفة')
    }
  }

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/barcode-scans`, {
        method: 'POST',
        body: JSON.stringify(barcodeScanForm)
      })

      if (response.ok) {
        toast.success('تم تسجيل مسح الباركود بنجاح')
        setIsBarcodeScanDialogOpen(false)
        setBarcodeScanForm({
          medicationId: '',
          medicationName: '',
          barcode: '',
          action: 'check',
          quantity: 1
        })
        refetchBarcodeScans()
      } else {
        toast.error('فشل تسجيل مسح الباركود')
      }
    } catch {
      toast.error('حدث خطأ أثناء تسجيل مسح الباركود')
    }
  }

  const handleAddPharmacyIntegration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/pharmacy-integrations`, {
        method: 'POST',
        body: JSON.stringify(pharmacyIntegrationForm)
      })

      if (response.ok) {
        toast.success('تم إضافة تكامل الصيدلية بنجاح')
        setIsPharmacyIntegrationDialogOpen(false)
        setPharmacyIntegrationForm({
          pharmacyName: '',
          pharmacyType: 'external',
          apiEndpoint: '',
          apiKey: '',
          supportedMedications: []
        })
        refetchPharmacyIntegrations()
      } else {
        toast.error('فشل إضافة تكامل الصيدلية')
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة تكامل الصيدلية')
    }
  }

  const filteredPrescriptions = prescriptions?.filter(presc => 
    presc.status === 'pending' &&
    (presc.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     presc.doctorName.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const dispensedPrescriptions = prescriptions?.filter(presc => 
    presc.status === 'dispensed'
  ) || []

  return (
    <PageTransition>
      <div className="flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex-shrink-0">
          <SlideIn direction="up" delay={0.1}>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-8 h-8 text-medical-blue" />
                الصيدلية
              </h1>
              <p className="text-slate-600 mt-1">إدارة الوصفات الطبية والأدوية</p>
            </div>
          </SlideIn>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="flex-shrink-0">
            <SlideIn direction="up" delay={0.15}>
              <Card className="border border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    تنبيه نفاد المخزون ({lowStockAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {lowStockAlerts.map(med => (
                      <div key={med.id} className="text-xs text-red-600 flex justify-between">
                        <span>{med.name}</span>
                        <Badge variant="destructive" className="text-xs">المخزون: {med.stock}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </SlideIn>
          </div>
        )}

        {/* Expired Medication Alerts */}
        {expiredAlerts.length > 0 && (
          <div className="flex-shrink-0">
            <SlideIn direction="up" delay={0.16}>
              <Card className="border border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    تنبيه انتهاء الصلاحية ({expiredAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {expiredAlerts.map(med => (
                      <div key={med.id} className="text-xs text-orange-600 flex justify-between">
                        <span>{med.name}</span>
                        <Badge variant="destructive" className="text-xs bg-orange-500 hover:bg-orange-600">
                          {med.expirationDate ? new Date(med.expirationDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </SlideIn>
          </div>
        )}

        {/* Reorder Alerts */}
        {reorderAlerts.length > 0 && (
          <div className="flex-shrink-0">
            <SlideIn direction="up" delay={0.17}>
              <Card className="border border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    تنبيه إعادة الطلب ({reorderAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {reorderAlerts.map(med => (
                      <div key={med.id} className="text-xs text-blue-600 flex justify-between">
                        <span>{med.name}</span>
                        <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-600">
                          احتاج: {med.reorderQuantity || 50}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </SlideIn>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex-shrink-0">
          <SlideIn direction="up" delay={0.2}>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="بحث عن وصفة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </SlideIn>
        </div>

        {/* Main Tabs - Flex-1 with inner scroll */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="pending" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                الوصفات المعلقة ({filteredPrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="dispensed" className="text-xs sm:text-sm">
                الوصفات المصروفة ({dispensedPrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs sm:text-sm">
                المخزون ({medications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="barcode" className="text-xs sm:text-sm">
                مسح الباركود ({barcodeScans?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pharmacy-integration" className="text-xs sm:text-sm">
                تكامل الصيدليات ({pharmacyIntegrations?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="flex-1 min-h-0 overflow-y-auto">
              <Card className="border border-slate-200 rounded-xl h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    الوصفات المعلقة للصرف
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
              {prescriptionsLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4 mb-3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Pill className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد وصفات معلقة
                    </h3>
                    <p className="text-sm text-gray-500">لا توجد وصفات تنتظر الصرف</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPrescriptions.map((prescription) => (
                    <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{prescription.patientName}</h3>
                              <Badge variant="secondary">{prescription.doctorName}</Badge>
                            </div>
                            <div className="space-y-1">
                              {prescription.medications.map((med, index) => (
                                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  <div className="font-medium">{med.medicationName}</div>
                                  <div className="text-xs">{med.dosage} - {med.frequency}</div>
                                </div>
                              ))}
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                              {new Date(prescription.createdAt).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleDispense(prescription.id)}>
                            <Check className="w-4 h-4 ml-2" />
                            صرف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

            <TabsContent value="dispensed" className="flex-1 min-h-0 overflow-y-auto">
              <Card className="border border-slate-200 rounded-xl h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    الوصفات المنفذة
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
              {prescriptionsLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4 mb-3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : dispensedPrescriptions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد وصفات منفذة
                    </h3>
                    <p className="text-sm text-gray-500">لم يتم صرف أي وصفة بعد</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {dispensedPrescriptions.map((prescription) => (
                    <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{prescription.patientName}</h3>
                              <Badge variant="default">منفذة</Badge>
                            </div>
                            <div className="space-y-1">
                              {prescription.medications.map((med, index) => (
                                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  <div className="font-medium">{med.medicationName}</div>
                                  <div className="text-xs">{med.dosage} - {med.frequency}</div>
                                </div>
                              ))}
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                              {new Date(prescription.createdAt).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 min-h-0 overflow-y-auto">
          <Card className="border border-slate-200 rounded-xl h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  المخزون
                </CardTitle>
                <Dialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={openAddMedicationDialog}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة دواء
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingMedication ? 'تعديل دواء' : 'إضافة دواء جديد'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={isEditingMedication ? handleUpdateMedication : handleAddMedication}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">اسم الدواء</Label>
                          <Input
                            id="name"
                            value={medicationForm.name}
                            onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">الوصف</Label>
                          <Input
                            id="description"
                            value={medicationForm.description}
                            onChange={(e) => setMedicationForm({ ...medicationForm, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stock">الكمية الحالية</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={medicationForm.stock}
                            onChange={(e) => setMedicationForm({ ...medicationForm, stock: parseInt(e.target.value) || 0 })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="minStock">الحد الأدنى للتنبيه</Label>
                          <Input
                            id="minStock"
                            type="number"
                            value={medicationForm.minStock}
                            onChange={(e) => setMedicationForm({ ...medicationForm, minStock: parseInt(e.target.value) || 10 })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">السعر</Label>
                          <Input
                            id="price"
                            type="number"
                            value={medicationForm.price}
                            onChange={(e) => setMedicationForm({ ...medicationForm, price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expirationDate">تاريخ الانتهاء</Label>
                          <Input
                            id="expirationDate"
                            type="date"
                            value={medicationForm.expirationDate}
                            onChange={(e) => setMedicationForm({ ...medicationForm, expirationDate: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="autoReorder"
                            checked={medicationForm.autoReorder}
                            onChange={(e) => setMedicationForm({ ...medicationForm, autoReorder: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="autoReorder" className="cursor-pointer">إعادة طلب آلي</Label>
                        </div>
                        {medicationForm.autoReorder && (
                          <>
                            <div>
                              <Label htmlFor="reorderQuantity">كمية إعادة الطلب</Label>
                              <Input
                                id="reorderQuantity"
                                type="number"
                                value={medicationForm.reorderQuantity}
                                onChange={(e) => setMedicationForm({ ...medicationForm, reorderQuantity: parseInt(e.target.value) || 50 })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="reorderThreshold">حد إعادة الطلب</Label>
                              <Input
                                id="reorderThreshold"
                                type="number"
                                value={medicationForm.reorderThreshold}
                                onChange={(e) => setMedicationForm({ ...medicationForm, reorderThreshold: parseInt(e.target.value) || 10 })}
                              />
                            </div>
                          </>
                        )}
                        <Button type="submit" className="w-full">
                          {isEditingMedication ? 'تحديث' : 'إضافة'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {medicationsLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4 mb-3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : medications?.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد أدوية في المخزون
                    </h3>
                    <p className="text-sm text-gray-500">قم بإضافة الأدوية للمخزون</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {medications.map((medication) => (
                    <Card key={medication.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{medication.name}</h3>
                              <Badge variant={medication.stock < (medication.minStock || 10) ? 'destructive' : 'default'}>
                                المخزون: {medication.stock}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{medication.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span>الحد الأدنى: {medication.minStock || 10}</span>
                              {medication.price && <span>السعر: {medication.price} ر.س</span>}
                              {medication.expirationDate && (
                                <span className={new Date(medication.expirationDate) <= new Date() ? 'text-red-600 font-medium' : ''}>
                                  انتهاء: {new Date(medication.expirationDate).toLocaleDateString('ar-SA')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditMedication(medication)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMedication(medication.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcode" className="flex-1 min-h-0 overflow-y-auto">
          <Card className="border border-slate-200 rounded-xl h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  مسح الباركود ({barcodeScans?.length || 0})
                </div>
                <Dialog open={isBarcodeScanDialogOpen} onOpenChange={setIsBarcodeScanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" />
                      مسح جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>مسح باركود جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleBarcodeScan} className="space-y-4">
                      <div>
                        <Label htmlFor="medicationName">اسم الدواء *</Label>
                        <Input
                          id="medicationName"
                          value={barcodeScanForm.medicationName}
                          onChange={(e) => setBarcodeScanForm({ ...barcodeScanForm, medicationName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="barcode">الباركود *</Label>
                        <Input
                          id="barcode"
                          value={barcodeScanForm.barcode}
                          onChange={(e) => setBarcodeScanForm({ ...barcodeScanForm, barcode: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="action">الإجراء *</Label>
                        <select
                          id="action"
                          value={barcodeScanForm.action}
                          onChange={(e) => setBarcodeScanForm({ ...barcodeScanForm, action: e.target.value as 'in' | 'out' | 'check' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        >
                          <option value="check">فحص</option>
                          <option value="in">إدخال</option>
                          <option value="out">إخراج</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="quantity">الكمية *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={barcodeScanForm.quantity}
                          onChange={(e) => setBarcodeScanForm({ ...barcodeScanForm, quantity: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsBarcodeScanDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit">تسجيل</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {barcodeScansLoading ? (
                <div className="text-center py-12">جاري التحميل...</div>
              ) : !barcodeScans || barcodeScans.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد عمليات مسح
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {barcodeScans.map((scan) => (
                    <Card key={scan.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{scan.medicationName}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Badge variant={scan.action === 'in' ? 'default' : scan.action === 'out' ? 'destructive' : 'secondary'}>
                                {scan.action === 'in' ? 'إدخال' : scan.action === 'out' ? 'إخراج' : 'فحص'}
                              </Badge>
                              <span className="text-sm">{scan.quantity} وحدة</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">الباركود:</span> {scan.barcode}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">مسح بواسطة:</span> {scan.scannedBy}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">تاريخ المسح:</span> {new Date(scan.scanDate).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacy-integration" className="flex-1 min-h-0 overflow-y-auto">
          <Card className="border border-slate-200 rounded-xl h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  تكامل الصيدليات ({pharmacyIntegrations?.length || 0})
                </div>
                <Dialog open={isPharmacyIntegrationDialogOpen} onOpenChange={setIsPharmacyIntegrationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة صيدلية
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة تكامل صيدلية جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPharmacyIntegration} className="space-y-4">
                      <div>
                        <Label htmlFor="pharmacyName">اسم الصيدلية *</Label>
                        <Input
                          id="pharmacyName"
                          value={pharmacyIntegrationForm.pharmacyName}
                          onChange={(e) => setPharmacyIntegrationForm({ ...pharmacyIntegrationForm, pharmacyName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="pharmacyType">نوع الصيدلية *</Label>
                        <select
                          id="pharmacyType"
                          value={pharmacyIntegrationForm.pharmacyType}
                          onChange={(e) => setPharmacyIntegrationForm({ ...pharmacyIntegrationForm, pharmacyType: e.target.value as 'internal' | 'external' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        >
                          <option value="internal">داخلي</option>
                          <option value="external">خارجي</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="apiEndpoint">رابط API</Label>
                        <Input
                          id="apiEndpoint"
                          value={pharmacyIntegrationForm.apiEndpoint}
                          onChange={(e) => setPharmacyIntegrationForm({ ...pharmacyIntegrationForm, apiEndpoint: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="apiKey">مفتاح API</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          value={pharmacyIntegrationForm.apiKey}
                          onChange={(e) => setPharmacyIntegrationForm({ ...pharmacyIntegrationForm, apiKey: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsPharmacyIntegrationDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit">إضافة</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {pharmacyIntegrationsLoading ? (
                <div className="text-center py-12">جاري التحميل...</div>
              ) : !pharmacyIntegrations || pharmacyIntegrations.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد تكاملات صيدليات
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {pharmacyIntegrations.map((integration) => (
                    <Card key={integration.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{integration.pharmacyName}</h3>
                              <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                                {integration.status === 'active' ? 'نشط' : 'غير نشط'}
                              </Badge>
                              <Badge variant="outline">
                                {integration.pharmacyType === 'internal' ? 'داخلي' : 'خارجي'}
                              </Badge>
                            </div>
                            {integration.apiEndpoint && (
                              <div className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">رابط API:</span> {integration.apiEndpoint}
                              </div>
                            )}
                            {integration.supportedMedications.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">الأدوية المدعومة:</span> {integration.supportedMedications.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </PageTransition>
  )
}
