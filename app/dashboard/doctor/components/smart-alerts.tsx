'use client'

import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge-redesigned'
import { Button } from '@/components/ui/button'

interface SmartAlert {
  id: string
  type: 'allergy' | 'drug-interaction' | 'follow-up' | 'warning'
  title: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

interface SmartAlertsProps {
  alerts: SmartAlert[]
  onDismiss?: (id: string) => void
}

export function SmartAlerts({ alerts, onDismiss }: SmartAlertsProps) {
  if (alerts.length === 0) return null

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'allergy':
      case 'drug-interaction':
        return <AlertTriangle className="w-5 h-5" />
      case 'follow-up':
        return <CheckCircle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getAlertColor = (severity: SmartAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-900'
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        التنبيهات الذكية
      </h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{alert.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {alert.severity === 'high' ? 'عالي' : alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                </div>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0"
                  onClick={() => onDismiss(alert.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
