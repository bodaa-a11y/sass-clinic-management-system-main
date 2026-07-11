'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge-redesigned'
import { Calendar, Clock, FileText, Stethoscope } from 'lucide-react'

interface TimelineEvent {
  id: string
  date: string
  type: 'visit' | 'diagnosis' | 'prescription' | 'lab' | 'radiology'
  title: string
  description: string
  doctor?: string
}

interface TimelineViewProps {
  events: TimelineEvent[]
}

export function TimelineView({ events }: TimelineViewProps) {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'visit':
        return <Stethoscope className="w-4 h-4" />
      case 'diagnosis':
        return <FileText className="w-4 h-4" />
      case 'prescription':
        return <FileText className="w-4 h-4" />
      case 'lab':
        return <FileText className="w-4 h-4" />
      case 'radiology':
        return <FileText className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'visit':
        return 'bg-blue-100 text-blue-700'
      case 'diagnosis':
        return 'bg-purple-100 text-purple-700'
      case 'prescription':
        return 'bg-green-100 text-green-700'
      case 'lab':
        return 'bg-orange-100 text-orange-700'
      case 'radiology':
        return 'bg-pink-100 text-pink-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getEventLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'visit':
        return 'زيارة'
      case 'diagnosis':
        return 'تشخيص'
      case 'prescription':
        return 'وصفة'
      case 'lab':
        return 'مختبر'
      case 'radiology':
        return 'أشعة'
      default:
        return 'أخرى'
    }
  }

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        السجل الزمني
      </h3>

      <div className="space-y-3">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا يوجد سجل زمني
          </div>
        ) : (
          sortedEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline Line */}
              {index !== sortedEvents.length - 1 && (
                <div className="absolute right-4 top-8 bottom-0 w-0.5 bg-gray-200" />
              )}

              <Card className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {getEventLabel(event.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString('ar-SA')}
                        {event.doctor && (
                          <>
                            <span>•</span>
                            <span>{event.doctor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
