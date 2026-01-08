'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ProtectedRoute from '../ProtectedRoute';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function DashboardLayout({
  children,
  allowedRoles,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}