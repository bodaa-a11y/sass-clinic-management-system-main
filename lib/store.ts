// CHANGED BY WINDSURF: Added clinicConfig to User interface
export interface ClinicConfig {
  facilityType: string;
  edition: string;
  enabledModules: string[];
  config: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  role: string;
  clinicId?: string;
  name?: string;
  permissions?: Record<string, string[]>;
  clinicConfig?: ClinicConfig;
}

export const store = {
  login: (token: string, user: User) => {
    if (typeof window === 'undefined') return;
    // Token is now stored in httpOnly cookie, no need to store in localStorage
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    // Token is in cookie, no need to remove from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('clinicConfig');
  },

  clearUser: () => {
    if (typeof window === 'undefined') return;
    // Token is in cookie, no need to remove from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('clinicConfig');
  },

  getToken: () => {
    // Token is now stored in httpOnly cookie, cannot be accessed from client-side
    if (typeof window === 'undefined') return null;
    return null; // Always return null as token is in cookie
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isLoggedIn: () => {
    if (typeof window === 'undefined') return false;
    // Check if user data exists in localStorage instead of token
    return !!localStorage.getItem('user');
  },

  // CHANGED BY WINDSURF: Added clinic config methods
  setClinicConfig: (clinicConfig: ClinicConfig) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('clinicConfig', JSON.stringify(clinicConfig));
  },

  getClinicConfig: (): ClinicConfig | null => {
    if (typeof window === 'undefined') return null;
    const configStr = localStorage.getItem('clinicConfig');
    return configStr ? JSON.parse(configStr) : null;
  },

  refreshClinicConfig: async (): Promise<ClinicConfig | null> => {
    if (typeof window === 'undefined') return null;
    try {
      // Token is in httpOnly cookie, sent automatically
      const response = await fetch('/api/auth/refresh-clinic-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to refresh clinic config:', await response.text());
        return null;
      }

      const result = await response.json();
      if (result.data) {
        localStorage.setItem('clinicConfig', JSON.stringify(result.data));
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing clinic config:', error);
      return null;
    }
  },
};
