'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Phone, Calendar, Mail } from 'lucide-react'

interface PatientCardProps {
  patient: {
    id: string
    fullName: string
    phone?: string
    email?: string
    dateOfBirth?: string
    gender?: string
    address?: string
  }
  onClick?: () => void
  showActions?: boolean
}

export function PatientCard({ patient, onClick, showActions = true }: PatientCardProps) {
  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${onClick ? 'hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{patient.fullName}</h3>
                {patient.gender && (
                  <Badge variant="outline" className="text-xs">
                    {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(patient.dateOfBirth).toLocaleDateString('ar-SA')}</span>
                </div>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
