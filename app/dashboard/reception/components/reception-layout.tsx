'use client';

import { ReactNode } from 'react';
import { ReceptionHeader } from './reception-header';

interface ReceptionLayoutProps {
  children: ReactNode;
}

export function ReceptionLayout({ children }: ReceptionLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ReceptionHeader />

      {/* Page Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
