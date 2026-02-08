'use client';

import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-500 text-xs tracking-widest animate-pulse">MEMUAT SISTEM...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}