'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-redesigned'
import { Users, Building2, Shield, Settings } from 'lucide-react'

interface AdminTabsProps {
  children: React.ReactNode
}

export function AdminTabs({ children }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="staff" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          الموظفين
        </TabsTrigger>
        <TabsTrigger value="permissions" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          الصلاحيات
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          الإعدادات
        </TabsTrigger>
      </TabsList>

      {children}
    </Tabs>
  )
}
