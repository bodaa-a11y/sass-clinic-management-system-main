// CHANGED BY GROK - Client-side TenantProvider + Dynamic Sidebar
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TenantProvider, useTenant } from '@/lib/tenant-context';
import { FacilityConfigProvider } from '@/lib/use-facility-config';
import { Sidebar } from '@/components/dynamic-sidebar';
import { UnauthorizedPage } from '@/components/unauthorized-page';
import { UserCard } from '@/components/ui/user-card';
import { CommandPalette } from '@/components/search/command-palette';
import { QuickActionsMenu } from '@/components/quick-actions/quick-actions-menu';
import { store } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { isLoaded, hasModule, enabledModules } = useTenant();

  // Route to module mapping
  const routeModuleMap: Record<string, string> = {
    '/dashboard/staff-management': 'staff_management',
    '/dashboard/reports': 'reports',
    '/dashboard/departments': 'departments',
  };

  const [shouldShowUnauthorized, setShouldShowUnauthorized] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | null>(null);

  useEffect(() => {
    const userData = store.getUser();
    setUser(userData);
  }, []);

  // Check module access on mount and when enabledModules change
  useEffect(() => {
    const requiredModule = routeModuleMap[pathname];
    if (requiredModule && !hasModule(requiredModule)) {
      setCurrentModule(requiredModule);
      setShouldShowUnauthorized(true);
    } else {
      setShouldShowUnauthorized(false);
      setCurrentModule(null);
    }
  }, [enabledModules, pathname, hasModule]);

  const handleLogout = async () => {
    try {
      // Call logout API to clear httpOnly cookie
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to clear cookie:', error);
    }
    store.logout();
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/dashboard/login');
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-shifa"></div>
          </div>
          <p className="text-sm font-bold text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // Show UnauthorizedPage if module is disabled
  if (shouldShowUnauthorized) {
    return <UnauthorizedPage moduleName={currentModule || undefined} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground" dir="rtl">
      {/* Sidebar ديناميكي */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border-shifa bg-card px-6 flex items-center justify-between relative z-10">
          <h1 className="font-display font-extrabold text-lg text-foreground">
            عافي - لوحة التحكم
          </h1>
          {/* User Menu */}
          <div className="flex items-center gap-4">
            <CommandPalette />
            <QuickActionsMenu />
            <UserCard
              name={user?.name}
              email={user?.email}
              role={user?.role}
              facility={user?.facilityName}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-rose-error/10 hover:text-rose-error text-muted-foreground gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              <LogOut className="w-4 h-4 ml-1.5" />
              تسجيل الخروج
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-bg-shifa-soft/30 relative">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/dashboard/login';

  return (
    <FacilityConfigProvider>
      <TenantProvider>
        {isLoginPage ? (
          // Login page: render children only without Sidebar and Header
          children
        ) : (
          // Dashboard pages: render full layout with Sidebar
          <DashboardContent>{children}</DashboardContent>
        )}
      </TenantProvider>
    </FacilityConfigProvider>
  );
}
