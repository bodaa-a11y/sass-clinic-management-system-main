// CHANGED BY WINDSURF - Themed Cura Sidebar to match Shifa Clinic style
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { store } from '@/lib/store';
import { useTenant } from '@/lib/tenant-context';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  DollarSign,
  Settings,
  UserCheck,
  BarChart3,
  Pill,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button-redesigned';

const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    href: '/dashboard',
    module: 'dashboard',
    permission: { resource: 'dashboard', action: 'view' },
  },
  {
    id: 'doctor',
    label: 'غرفة الطبيب',
    icon: Stethoscope,
    href: '/dashboard/doctor',
    module: 'doctor',
    permission: { resource: 'doctor', action: 'view' },
  },
  {
    id: 'live-monitor',
    label: 'المراقب المباشر',
    icon: Clock,
    href: '/dashboard/live-monitor',
    module: 'live-monitor',
    permission: { resource: 'live-monitor', action: 'view' },
  },
  {
    id: 'reception',
    label: 'الاستقبال',
    icon: UserCheck,
    href: '/dashboard/reception',
    module: 'reception',
    permission: { resource: 'reception', action: 'view' },
  },
  {
    id: 'finance',
    label: 'المالية',
    icon: DollarSign,
    href: '/dashboard/finance',
    module: 'finance',
    permission: { resource: 'finance', action: 'view' },
  },
  {
    id: 'pharmacy',
    label: 'الصيدلية',
    icon: Pill,
    href: '/dashboard/pharmacy',
    module: 'pharmacy',
    permission: { resource: 'pharmacy', action: 'view' },
    featureFlag: 'pharmacy',
  },
  {
    id: 'reports',
    label: 'التقارير',
    icon: BarChart3,
    href: '/dashboard/reports',
    module: 'reports',
    permission: { resource: 'reports', action: 'view' },
  },
  {
    id: 'schedule',
    label: 'الجداول',
    icon: Calendar,
    href: '/dashboard/schedule',
    module: 'schedule',
    permission: { resource: 'schedule', action: 'view' },
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: Settings,
    href: '/dashboard/settings',
    module: 'settings',
    permission: { resource: 'settings', action: 'view' },
  },
  {
    id: 'admin',
    label: 'إدارة العيادة',
    icon: Building2,
    href: '/dashboard/admin',
    module: 'admin',
    permission: { resource: 'admin', action: 'view' },
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { enabledModules, isLoaded } = useTenant();
  const user = store.getUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isLoaded) {
    return <div className="w-64 border-l border-border-shifa bg-card h-screen" />;
  }

  const filteredItems = NAVIGATION_ITEMS.filter(item => {
    // Check if feature flag is enabled for this item
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag as any)) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`
        border-l border-border-shifa bg-card h-screen flex flex-col transition-all duration-300 relative z-20 font-sans
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border-shifa flex items-center justify-between">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-accent-shifa shadow-sm">
              <Heart className="w-4.5 h-4.5 text-[#001810]" />
              <span className="pulse-ring-shifa !inset-[-2px]" />
            </div>
            <div className="leading-none text-right">
              <div className="font-display font-bold text-sm text-foreground">شفاء</div>
              <div className="text-[7px] tracking-[0.2em] font-medium text-muted-foreground">SHIFA SYSTEM</div>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-shifa shadow-sm mx-auto">
            <Heart className="w-4.5 h-4.5 text-[#001810]" />
          </div>
        )}
        
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-bg-shifa-soft text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute -left-3.5 top-[74px] w-7 h-7 bg-card border border-border-shifa rounded-full flex items-center justify-center hover:bg-bg-shifa-soft shadow-sm z-30 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-accent-shifa text-[#001810] font-bold shadow-[0_4px_20px_-4px_rgba(0,255,178,0.4)]'
                  : 'text-muted-foreground hover:bg-bg-shifa-soft hover:text-foreground'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-semibold text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border-shifa bg-bg-shifa-soft/50">
          <div className="text-[10px] text-muted-foreground text-center font-bold tracking-wider">
            منصة شفاء الطبية v1.0
          </div>
        </div>
      )}
    </div>
  );
}
