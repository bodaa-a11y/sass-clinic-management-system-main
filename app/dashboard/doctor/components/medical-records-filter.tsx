'use client'

import { useState } from 'react'
import { Calendar, Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MedicalRecordsFilterProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  dateFrom: string
  dateTo: string
  visitType: string
  doctor: string
}

export function MedicalRecordsFilter({ onFilterChange }: MedicalRecordsFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    visitType: '',
    doctor: '',
  })

  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClear = () => {
    const clearedFilters: FilterState = {
      dateFrom: '',
      dateTo: '',
      visitType: '',
      doctor: '',
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="h-4 w-4 mr-2" />
        فلترة
        <ChevronDown className="h-4 w-4 mr-2 ml-1" />
        {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-blue-500" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">فلترة السجلات</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <X className="h-4 w-4 mr-1" />
                  مسح
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">من تاريخ</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">إلى تاريخ</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع الزيارة</label>
              <Select value={filters.visitType} onValueChange={(value: string) => handleFilterChange('visitType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الزيارة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">استشارة</SelectItem>
                  <SelectItem value="follow-up">متابعة</SelectItem>
                  <SelectItem value="emergency">طوارئ</SelectItem>
                  <SelectItem value="routine">روتين</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الطبيب</label>
              <Select value={filters.doctor} onValueChange={(value: string) => handleFilterChange('doctor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطبيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأطباء</SelectItem>
                  <SelectItem value="dr-ahmed">د. أحمد</SelectItem>
                  <SelectItem value="dr-sara">د. سارة</SelectItem>
                  <SelectItem value="dr-mohammed">د. محمد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
