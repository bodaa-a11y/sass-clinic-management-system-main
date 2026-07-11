'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ControlCenterTab {
  value: string
  label: string
  icon?: React.ReactNode
}

interface ControlCenterTabsProps {
  tabs: ControlCenterTab[]
  defaultValue?: string
  children: React.ReactNode
  className?: string
}

export function ControlCenterTabs({ tabs, defaultValue, children, className }: ControlCenterTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className} dir="rtl">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}
