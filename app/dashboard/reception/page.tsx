'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { AppointmentsTab } from './components/appointments-tab'
import { PatientsTab } from './components/patients-tab'
import { InvoicesTab } from './components/invoices-tab'
import { DocumentsTab } from './components/documents-tab'
import { ReceptionDashboard } from './components/reception-dashboard'
import { ReceptionLayout } from './components/reception-layout'
import { TodayWorkflow } from './components/today-workflow'
import { PageTransition } from '@/components/animations/page-transition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Button } from '@/components/ui/button-redesigned'
import { Calendar, Users, FileText, Plus } from 'lucide-react'

export default function ReceptionPageV2() {
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])

  useEffect(() => {
    const user = store.getUser()
    if (user?.clinicId) {
      setClinicId(user.clinicId)
      fetchData(user.clinicId)
    }
  }, [])

  const fetchData = async (id: string) => {
    try {
      const [aptRes, patRes, invRes, docRes, staffRes] = await Promise.all([
        apiFetch(`/clinics/${id}/appointments`),
        apiFetch(`/clinics/${id}/patients`),
        apiFetch(`/clinics/${id}/invoices`),
        apiFetch(`/clinics/${id}/medical-documents`),
        apiFetch(`/clinics/${id}/staff?role=doctor`)
      ])

      if (aptRes.ok) {
        const aptData = await aptRes.json()
        setAppointments(aptData?.data || [])
      }
      if (patRes.ok) {
        const patData = await patRes.json()
        setPatients(patData?.data || [])
      }
      if (invRes.ok) {
        const invData = await invRes.json()
        setInvoices(invData?.data || [])
      }
      if (docRes.ok) {
        const docData = await docRes.json()
        setDocuments(docData?.data || [])
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setDoctors(staffData?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleConfirmAppointment = async (id: string) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'confirmed' })
      })
      fetchData(clinicId)
    } catch (error) {
      console.error('Failed to confirm appointment:', error)
    }
  }

  const handleCheckIn = async (id: string) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'in-waiting-room' })
      })
      fetchData(clinicId)
    } catch (error) {
      console.error('Failed to check in:', error)
    }
  }

  const handleCancelAppointment = async (id: string) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      })
      fetchData(clinicId)
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
    }
  }

  const handleCreateAppointment = async (data: any) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/appointments`, {
        method: 'POST',
        body: JSON.stringify({ ...data, status: 'pending' })
      })
      fetchData(clinicId)
    } catch (error) {
      console.error('Failed to create appointment:', error)
    }
  }

  const handleSendReminder = (appointment: any) => {
    // Implement reminder logic
    console.log('Sending reminder to:', appointment.patientName)
  }

  const handleCreatePatient = async (data: any) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/patients`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      fetchData(clinicId)
    } catch (error) {
      console.error('Failed to create patient:', error)
    }
  }

  const handleCreateInvoice = async (data: any) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({ ...data, status: 'pending' })
      })
      fetchData(clinicId)
    } catch (error) {
      console.error('Failed to create invoice:', error)
    }
  }

  const handleUploadDocument = async (data: any) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/medical-documents`, {
        method: 'POST',
        body: JSON.stringify({ ...data, status: 'pending' })
      })
      fetchData(clinicId)
    } catch (error) {
      console.error('Failed to upload document:', error)
    }
  }

  const handleSearchPatient = () => {
    // Scroll to patients section
    const patientsSection = document.getElementById('patients-section')
    patientsSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleViewAppointments = () => {
    // Scroll to appointments section
    const appointmentsSection = document.getElementById('appointments-section')
    appointmentsSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCheckInFromWorkflow = () => {
    // Scroll to appointments section
    const appointmentsSection = document.getElementById('appointments-section')
    appointmentsSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCreateAppointmentFromWorkflow = () => {
    handleCreateAppointment({})
  }

  // Calculate dashboard stats
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => apt.appointmentDate === today).length
  const waitingPatients = appointments.filter(apt => apt.status === 'in-waiting-room').length
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length
  const completedAppointments = appointments.filter(apt => apt.status === 'done').length

  return (
    <ReceptionLayout>
      <PageTransition>
        <div className="space-y-8">
          {/* Dashboard Stats */}
          <ReceptionDashboard
            todayAppointments={todayAppointments}
            totalPatients={patients.length}
            pendingInvoices={pendingInvoices}
            waitingPatients={waitingPatients}
            completedAppointments={completedAppointments}
          />

          {/* Today's Workflow */}
          <TodayWorkflow
            onSearchPatient={handleSearchPatient}
            onViewAppointments={handleViewAppointments}
            onCheckIn={handleCheckInFromWorkflow}
            onCreateAppointment={handleCreateAppointmentFromWorkflow}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={() => handleCreateAppointment({})}
                className="bg-blue-700 hover:bg-blue-800 text-white h-12"
              >
                <Calendar className="w-4 h-4 ml-2" />
                موعد جديد
              </Button>
              <Button
                onClick={() => handleCreatePatient({})}
                className="bg-green-700 hover:bg-green-800 text-white h-12"
              >
                <Users className="w-4 h-4 ml-2" />
                مريض جديد
              </Button>
              <Button
                onClick={() => handleCreateInvoice({})}
                className="bg-purple-700 hover:bg-purple-800 text-white h-12"
              >
                <FileText className="w-4 h-4 ml-2" />
                فاتورة جديدة
              </Button>
              <Button
                onClick={() => handleUploadDocument({})}
                className="bg-orange-700 hover:bg-orange-800 text-white h-12"
              >
                <Plus className="w-4 h-4 ml-2" />
                مستند جديد
              </Button>
            </div>
          </div>

          {/* Grid Layout for Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Appointments Section */}
            <Card className="lg:col-span-2 shadow-sm" id="appointments-section">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="w-6 h-6 text-blue-700" />
                  المواعيد
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <AppointmentsTab
                  appointments={appointments}
                  doctors={doctors}
                  onConfirm={handleConfirmAppointment}
                  onCheckIn={handleCheckIn}
                  onCancel={handleCancelAppointment}
                  onCreate={handleCreateAppointment}
                  onSendReminder={handleSendReminder}
                  clinicId={clinicId}
                />
              </CardContent>
            </Card>

            {/* Patients Section */}
            <Card className="shadow-sm" id="patients-section">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-6 h-6 text-green-700" />
                  المرضى
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <PatientsTab
                  patients={patients}
                  onCreate={handleCreatePatient}
                  clinicId={clinicId || ''}
                />
              </CardContent>
            </Card>

            {/* Invoices Section */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="w-6 h-6 text-purple-700" />
                  الفواتير
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <InvoicesTab
                  invoices={invoices}
                  onCreate={handleCreateInvoice}
                />
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="w-6 h-6 text-orange-700" />
                  المستندات
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <DocumentsTab
                  documents={documents}
                  onUpload={handleUploadDocument}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    </ReceptionLayout>
  )
}
