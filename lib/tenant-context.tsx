// NEW FILE - Tenant Context for client-side auth (localStorage)
'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { store } from './store';
import { getModulesForFacilityType } from './modules-config';

export type TenantContextType = {
  clinicId: string | null;
  facilityType: 'single_clinic' | 'multi_clinic' | 'medical_center';
  edition: 'basic' | 'pro' | 'enterprise';
  enabledModules: string[];
  config: Record<string, unknown>;
  isLoaded: boolean;
  hasModule: (moduleName: string) => boolean;
  refreshConfig: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantContextType>({
    clinicId: null,
    facilityType: 'single_clinic',
    edition: 'basic',
    enabledModules: [],
    config: {},
    isLoaded: false,
    hasModule: (moduleName: string) => false,
    refreshConfig: async () => {},
  });

  // Refresh config function
  const refreshConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh-clinic-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const latestConfig = result.data || {};

        const facilityType = (latestConfig?.facilityType as any) || 'single_clinic';
        
        // Always use default modules based on facility type to ensure latest modules
        // This handles cases where enabledModules in DB is outdated
        const defaultModules = getModulesForFacilityType(facilityType);
        
        // Always use default modules to ensure latest configuration
        const enabledModules = defaultModules;

        // Update localStorage with latest config
        localStorage.setItem('clinicConfig', JSON.stringify({
          ...latestConfig,
          enabledModules,
        }));

        setTenant(prev => ({
          ...prev,
          facilityType,
          edition: (latestConfig?.edition as any) || 'basic',
          enabledModules,
          config: latestConfig?.config || {},
          hasModule: (moduleName: string) => enabledModules.includes(moduleName as any),
        }));
        
        console.log('[TenantContext] Loaded config:', { facilityType, enabledModules });
      }
    } catch (error) {
      console.error('[TenantContext] Failed to refresh config:', error);
    }
  }, []);

  useEffect(() => {
    // قراءة البيانات من localStorage بعد login
    const loadTenant = async () => {
      const user = store.getUser();

      if (user) {
        // Fetch latest config from server to ensure we have the latest facility type
        try {
          const response = await fetch('/api/auth/refresh-clinic-config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            const latestConfig = result.data || {};

            const facilityType = (latestConfig?.facilityType as any) || 'single_clinic';
            
            // Always use default modules based on facility type to ensure latest modules
            const defaultModules = getModulesForFacilityType(facilityType);
            
            // Always use default modules to ensure latest configuration
            const enabledModules = defaultModules;

            // Update localStorage with latest config
            localStorage.setItem('clinicConfig', JSON.stringify({
              ...latestConfig,
              enabledModules,
            }));

            setTenant(prev => ({
              ...prev,
              clinicId: user.clinicId || null,
              facilityType,
              edition: (latestConfig?.edition as any) || 'basic',
              enabledModules,
              config: latestConfig?.config || {},
              isLoaded: true,
              hasModule: (moduleName: string) => enabledModules.includes(moduleName as any),
              refreshConfig,
            }));
            
            console.log('[TenantContext] Loaded config from server:', { facilityType, enabledModules });
          } else {
            // Fallback to localStorage if server fetch fails
            const clinicConfig = store.getClinicConfig();
            const facilityType = (clinicConfig?.facilityType as any) || 'single_clinic';
            const defaultModules = getModulesForFacilityType(facilityType);
            
            // Always use default modules to ensure latest configuration
            const enabledModules = defaultModules;

            setTenant(prev => ({
              ...prev,
              clinicId: user.clinicId || null,
              facilityType,
              edition: (clinicConfig?.edition as any) || 'basic',
              enabledModules,
              config: clinicConfig?.config || {},
              isLoaded: true,
              hasModule: (moduleName: string) => enabledModules.includes(moduleName as any),
              refreshConfig,
            }));
            
            console.log('[TenantContext] Loaded config from localStorage fallback:', { facilityType, enabledModules });
          }
        } catch (error) {
          console.error('[TenantContext] Failed to fetch latest config, using localStorage fallback:', error);
          // Fallback to localStorage if fetch fails
          const clinicConfig = store.getClinicConfig();
          const facilityType = (clinicConfig?.facilityType as any) || 'single_clinic';
          const defaultModules = getModulesForFacilityType(facilityType);
          
          // Always use default modules to ensure latest configuration
          const enabledModules = defaultModules;

          setTenant(prev => ({
            ...prev,
            clinicId: user.clinicId || null,
            facilityType,
            edition: (clinicConfig?.edition as any) || 'basic',
            enabledModules,
            config: clinicConfig?.config || {},
            isLoaded: true,
            hasModule: (moduleName: string) => enabledModules.includes(moduleName as any),
            refreshConfig,
          }));
          
          console.log('[TenantContext] Loaded config from catch fallback:', { facilityType, enabledModules });
        }
      } else {
        setTenant(prev => ({ ...prev, isLoaded: true, refreshConfig }));
      }
    };

    // Load immediately on mount
    loadTenant();

    // إعادة تحميل عند تغيير localStorage (مثل login/logout)
    // storage event يُرسل فقط عند تغيير localStorage من tab آخر
    window.addEventListener('storage', loadTenant);

    // إضافة custom event listener لإعادة تحميل عند login من نفس tab
    const handleLoginEvent = () => loadTenant();
    window.addEventListener('clinicConfigUpdated', handleLoginEvent);

    // Poll for config changes every 30 seconds
    const pollingInterval = setInterval(() => {
      loadTenant();
    }, 30000);

    return () => {
      window.removeEventListener('storage', loadTenant);
      window.removeEventListener('clinicConfigUpdated', handleLoginEvent);
      clearInterval(pollingInterval);
    };
  }, []);

  return (
    <TenantContext.Provider value={tenant}>
      <TenantRefresh refreshConfig={refreshConfig}>{children}</TenantRefresh>
    </TenantContext.Provider>
  );
}

// Internal component to use usePathname for navigation-based refresh
function TenantRefresh({ children, refreshConfig }: { children: ReactNode; refreshConfig: () => Promise<void> }) {
  const pathname = usePathname();
  const lastPathnameRef = useRef('');

  useEffect(() => {
    // Only refresh when pathname changes (not on initial mount)
    if (lastPathnameRef.current && pathname !== lastPathnameRef.current) {
      refreshConfig();
    }
    lastPathnameRef.current = pathname;
  }, [pathname, refreshConfig]);

  return <>{children}</>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
