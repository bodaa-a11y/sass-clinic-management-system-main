'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned';
import { Search, Calendar, CheckCircle, Plus } from 'lucide-react';

interface TodayWorkflowProps {
  onSearchPatient: () => void;
  onViewAppointments: () => void;
  onCheckIn: () => void;
  onCreateAppointment: () => void;
}

export function TodayWorkflow({
  onSearchPatient,
  onViewAppointments,
  onCheckIn,
  onCreateAppointment
}: TodayWorkflowProps) {
  const steps = [
    {
      number: 1,
      title: 'البحث عن المريض',
      description: 'ابحث عن المريض برقم الهاتف أو الاسم',
      icon: Search,
      action: onSearchPatient,
      color: 'blue'
    },
    {
      number: 2,
      title: 'عرض المواعيد',
      description: 'راجع مواعيد اليوم',
      icon: Calendar,
      action: onViewAppointments,
      color: 'green'
    },
    {
      number: 3,
      title: 'تسجيل الحضور',
      description: 'سجل حضور المريض',
      icon: CheckCircle,
      action: onCheckIn,
      color: 'purple'
    },
    {
      number: 4,
      title: 'إنشاء موعد جديد',
      description: 'احجز موعد جديد للمريض',
      icon: Plus,
      action: onCreateAppointment,
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">سير العمل اليومي</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.number}
                onClick={step.action}
                className={`p-4 rounded-lg border-2 transition-all ${colorClasses[step.color as keyof typeof colorClasses]} hover:shadow-md`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${iconColorClasses[step.color as keyof typeof iconColorClasses]} shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-600">
                    {step.number}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
