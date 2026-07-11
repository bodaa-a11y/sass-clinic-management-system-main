'use client'

import { useState } from 'react'
import { Calendar, Users, DollarSign, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-redesigned'

interface ReceptionTabsProps {
  children: React.ReactNode
}

export function ReceptionTabs({ children }: ReceptionTabsProps) {
  const [activeTab, setActiveTab] = useState('appointments')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="appointments" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          المواعيد
        </TabsTrigger>
        <TabsTrigger value="patients" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          المرضى
        </TabsTrigger>
        <TabsTrigger value="invoices" className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          الفواتير
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          الوثائق
        </TabsTrigger>
      </TabsList>

      {children}
    </Tabs>
  )
}
