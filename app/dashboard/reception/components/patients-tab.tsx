'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { UserPlus, Search, Phone, Mail, Calendar, Plus } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'
import { PatientWizard } from './patient-wizard'
import { PatientSearch } from './patient-search'
import { showSuccessMessage } from '@/lib/toast-messages'

interface Patient {
  id: string
  fullName: string
  phone: string
  email?: string
  dateOfBirth?: string
  address?: string
  insuranceNumber?: string
  insuranceProvider?: string
}

interface PatientsTabProps {
  patients: Patient[]
  onCreate: (data: any) => void
  clinicId: string
}

export function PatientsTab({ patients, onCreate, clinicId }: PatientsTabProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery)
  )

  const handleCreate = (data: any) => {
    onCreate(data)
    setIsWizardOpen(false)
    showSuccessMessage('تم إضافة المريض بنجاح', 'يمكنك الآن حجز موعد للمريض')
  }

  const handlePatientFound = (patient: Patient) => {
    setSelectedPatient(patient)
    showSuccessMessage('تم العثور على المريض', 'عرض بيانات المريض')
    // Show patient details or update form
  }

  const handlePatientNotFound = () => {
    setIsWizardOpen(true)
  }

  return (
    <SlideIn direction="up" delay={0.2}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المرضى</h2>
            <p className="text-sm text-gray-500 mt-1">إضافة وإدارة بيانات المرضى</p>
          </div>
          <HoverScale>
            <Button onClick={() => setIsWizardOpen(true)}>
              <UserPlus className="w-4 h-4 ml-2" />
              مريض جديد
            </Button>
          </HoverScale>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="بحث عن مريض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Patients List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">لا يوجد مرضى</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{patient.fullName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                    {patient.dateOfBirth && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{patient.dateOfBirth}</span>
                      </div>
                    )}
                    {patient.insuranceProvider && (
                      <div className="text-xs text-gray-500">
                        التأمين: {patient.insuranceProvider}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Patient Wizard Dialog */}
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogContent className="max-w-3xl">
            {/* Patient Search Step */}
            <PatientSearch
              clinicId={clinicId}
              onPatientFound={handlePatientFound}
              onPatientNotFound={() => {/* Already in wizard */}}
            />
          </DialogContent>
        </Dialog>
      </div>
    </SlideIn>
  )
}
