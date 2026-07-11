'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button-redesigned';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Calendar, Users, DollarSign, Stethoscope, Clock } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { store } from '@/lib/store';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  roles?: string[];
}

export function QuickActionsMenu() {
  const { facilityType } = useTenant();
  const user = store.getUser();
  const userRole = user?.role;

  const quickActions: QuickAction[] = [
    {
      id: 'appointment',
      label: 'حجز موعد جديد',
      icon: <Calendar className="w-4 h-4" />,
      href: '/dashboard/appointments/new',
      roles: ['clinic_admin', 'receptionist', 'doctor'],
    },
    {
      id: 'patient',
      label: 'تسجيل مريض جديد',
      icon: <Users className="w-4 h-4" />,
      href: '/dashboard/patients/new',
      roles: ['clinic_admin', 'receptionist', 'doctor'],
    },
    {
      id: 'expense',
      label: 'إضافة مصروفات',
      icon: <DollarSign className="w-4 h-4" />,
      href: '/dashboard/finance/expenses/new',
      roles: ['clinic_admin', 'receptionist'],
    },
    {
      id: 'checkin',
      label: 'تسجيل وصول',
      icon: <Clock className="w-4 h-4" />,
      href: '/dashboard/reception',
      roles: ['receptionist'],
    },
    {
      id: 'exam',
      label: 'بدء فحص سريع',
      icon: <Stethoscope className="w-4 h-4" />,
      href: '/dashboard/doctor',
      roles: ['doctor'],
    },
  ];

  const filteredActions = quickActions.filter(
    (action) => !action.roles || action.roles.includes(userRole || '')
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">إضافة سريعة</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {filteredActions.map((action) => (
          <DropdownMenuItem key={action.id} asChild>
            <a href={action.href} className="flex items-center gap-3 cursor-pointer">
              {action.icon}
              <span>{action.label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
