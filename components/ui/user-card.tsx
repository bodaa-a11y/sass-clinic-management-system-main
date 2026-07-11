'use client';

import { User, Building2 } from 'lucide-react';

interface UserCardProps {
  name?: string;
  email?: string;
  role?: string;
  facility?: string;
}

export function UserCard({ name, email, role, facility }: UserCardProps) {
  const displayName = name || email || 'المستخدم';
  const displayRole = role || 'موظف';
  const displayFacility = facility || '';

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="w-10 h-10 bg-medical-blue/10 rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-medical-blue" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-900">{displayName}</span>
        <span className="text-xs text-slate-600">{displayRole}</span>
        {displayFacility && (
          <div className="flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">{displayFacility}</span>
          </div>
        )}
      </div>
    </div>
  );
}
