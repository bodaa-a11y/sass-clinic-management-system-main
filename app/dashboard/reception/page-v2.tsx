'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { ReceptionTabs } from './components/reception-tabs'
import { AppointmentsTab } from './components/appointments-tab'
import { PatientsTab } from './components/patients-tab'
import { InvoicesTab } from './components/invoices-tab'
import { DocumentsTab } from './components/documents-tab'
import { ReceptionDashboard } from './components/reception-dashboard'
import { PageTransition } from '@/components/animations/page-transition'

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
      const [aptRes, patRes, invRes, docRes, docData] = await Promise.all([
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
      if (docData.ok) {
        const staffData = await docData.json()
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

  // Calculate dashboard stats
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => apt.appointmentDate === today).length
  const waitingPatients = appointments.filter(apt => apt.status === 'in-waiting-room').length
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Dashboard Stats */}
        <ReceptionDashboard
          todayAppointments={todayAppointments}
          totalPatients={patients.length}
          pendingInvoices={pendingInvoices}
          waitingPatients={waitingPatients}
        />

        {/* Tabs */}
        <ReceptionTabs>
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

          <PatientsTab
            patients={patients}
            onCreate={handleCreatePatient}
          />

          <InvoicesTab
            invoices={invoices}
            onCreate={handleCreateInvoice}
          />

          <DocumentsTab
            documents={documents}
            onUpload={handleUploadDocument}
          />
        </ReceptionTabs>
      </div>
    </PageTransition>
  )
}
