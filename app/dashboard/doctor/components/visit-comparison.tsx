'use client'

import { useState } from 'react'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'

interface Visit {
  id: string
  date: string
  diagnosis: string
  symptoms: string
  bloodPressure: string
  heartRate: string
  weight: string
  notes: string
}

interface VisitComparisonProps {
  visits: Visit[]
}

export function VisitComparison({ visits }: VisitComparisonProps) {
  const [selectedVisits, setSelectedVisits] = useState<[Visit | null, Visit | null]>([null, null])

  const handleSelectVisit = (visit: Visit, index: 0 | 1) => {
    const newSelection = [...selectedVisits] as [Visit | null, Visit | null]
    newSelection[index] = visit
    setSelectedVisits(newSelection)
  }

  const getTrendIcon = (current: string, previous: string) => {
    const curr = parseFloat(current) || 0
    const prev = parseFloat(previous) || 0
    
    if (curr > prev) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (curr < prev) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const compareVisits = () => {
    if (!selectedVisits[0] || !selectedVisits[1]) return null

    const [visit1, visit2] = selectedVisits

    return (
      <div className="space-y-4 mt-6">
        <h3 className="font-semibold text-lg">مقارنة بين الزيارات</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">الزيارة الأولى</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{visit1.date}</p>
              <p className="mt-2 font-medium">{visit1.diagnosis}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ضغط الدم:</span>
                  <span>{visit1.bloodPressure}</span>
                </div>
                <div className="flex justify-between">
                  <span>نبض القلب:</span>
                  <span>{visit1.heartRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>الوزن:</span>
                  <span>{visit1.weight}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">الزيارة الثانية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{visit2.date}</p>
              <p className="mt-2 font-medium">{visit2.diagnosis}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>ضغط الدم:</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(visit2.bloodPressure, visit1.bloodPressure)}
                    <span>{visit2.bloodPressure}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>نبض القلب:</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(visit2.heartRate, visit1.heartRate)}
                    <span>{visit2.heartRate}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>الوزن:</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(visit2.weight, visit1.weight)}
                    <span>{visit2.weight}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">التغييرات في التشخيص</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">من: {visit1.diagnosis}</p>
                  <p className="text-sm font-medium">إلى: {visit2.diagnosis}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {visit1.notes !== visit2.notes 
                    ? 'هناك تغيير في الملاحظات الطبية بين الزيارتين'
                    : 'لا توجد تغييرات جوهرية في الملاحظات'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">مقارنة الزيارات</h3>
        <Button variant="outline" size="sm" onClick={() => setSelectedVisits([null, null])}>
          مسح الاختيار
        </Button>
      </div>

      <div className="grid gap-2">
        {visits.map((visit, index) => (
          <Card
            key={visit.id}
            className={`cursor-pointer transition-colors ${
              selectedVisits.includes(visit) ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
            }`}
            onClick={() => {
              if (!selectedVisits[0]) {
                handleSelectVisit(visit, 0)
              } else if (!selectedVisits[1]) {
                handleSelectVisit(visit, 1)
              }
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{visit.date}</p>
                  <p className="text-xs text-muted-foreground">{visit.diagnosis}</p>
                </div>
                {selectedVisits.includes(visit) && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {compareVisits()}
    </div>
  )
}
