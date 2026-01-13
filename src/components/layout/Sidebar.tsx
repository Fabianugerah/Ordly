'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LogOut, Plus, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  FileText,
  Settings,
  TrendingUp,
  BarChart3,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const role = user?.level?.nama_level;
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      router.push('/login');
    }
  };

  // Main menu items based on role
  const mainMenuItems = {
    administrator: [
      { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/admin/users', icon: Users, label: 'Manajemen User' },
      { href: '/dashboard/admin/menu', icon: UtensilsCrossed, label: 'Manajemen Menu' },
      { href: '/dashboard/admin/orders', icon: ShoppingCart, label: 'Pesanan' },
      { href: '/dashboard/admin/transaksi', icon: Receipt, label: 'Transaksi' },
    ],
    waiter: [
      { href: '/dashboard/waiter', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/waiter/menu', icon: UtensilsCrossed, label: 'Menu' },
      { href: '/dashboard/waiter/order', icon: ShoppingCart, label: 'Buat Pesanan' },
      { href: '/dashboard/waiter/orders', icon: ShoppingCart, label: 'Daftar Pesanan' },
    ],
    kasir: [
      { href: '/dashboard/kasir', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/kasir/pembayaran', icon: Receipt, label: 'Pembayaran' },
      { href: '/dashboard/kasir/transaksi', icon: Receipt, label: 'Riwayat Transaksi' },
    ],
    owner: [
      { href: '/dashboard/owner', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/owner/analytics', icon: TrendingUp, label: 'Analytics' },
    ],
    customer: [
      { href: '/dashboard/customer', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/customer/menu', icon: UtensilsCrossed, label: 'Menu' },
      { href: '/dashboard/customer/order', icon: ShoppingCart, label: 'Buat Pesanan' },
      { href: '/dashboard/customer/orders', icon: ShoppingCart, label: 'Pesanan Saya' },
    ],
  };

  // Projects menu (Laporan section)
  const projectItems = {
    administrator: [
      { href: '/dashboard/admin/laporan', icon: FileText, label: 'Laporan Restoran' },
      { href: '/dashboard/admin/analytics', icon: BarChart3, label: 'Analytics' },
    ],
    waiter: [
      { href: '/dashboard/waiter/laporan', icon: FileText, label: 'Laporan Saya' },
    ],
    kasir: [],
    owner: [
      { href: '/dashboard/owner/laporan', icon: FileText, label: 'Laporan Bisnis' },
    ],
    customer: [],
  };

  const currentMainMenu = role ? mainMenuItems[role] || [] : [];
  const currentProjects = role ? projectItems[role] || [] : [];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 
          bg-white dark:bg-neutral-900
          border-r border-neutral-200 dark:border-neutral-800
          z-40 transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {/* MAIN MENU Section */}
            <div className="px-4 pt-6 pb-4">
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Main Menu
                </h3>
              </div>
              <nav className="space-y-1">
                {currentMainMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-gradient-to-b from-neutral-300/10 via-neutral-300/5 to-neutral-800/20 text-white shadow-lg shadow-black/10'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                        }`}
                    >
                      {/* 1. Neon Indicator Bar (Samping luar) */}
                      {isActive && (
                        <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 shadow-[0_0_15px_#F97316] rounded-r-full" />
                      )}

                      {/* 2. Inner Left Glow (Pantulan cahaya di dalam menu) */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-12 border-l-2 border-orange-500/60 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-orange-500/0  rounded-l-xl pointer-events-none" />
                      )}

                      {/* 3. Icon */}
                      <Icon className="w-5 h-5 transition-transform duration-200" />

                      {/* 4. Label */}
                      <span className={`relative z-10 font-semibold text-[14px] transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                        }`}>
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight className="w-5 h-5 ml-auto text-white" />
                      )}
                      {isActive && (
                        <div className="absolute inset-0 border-t border-white/5 rounded-xl pointer-events-none" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* PROJECTS Section (Laporan) */}
            {currentProjects.length > 0 && (
              <div className="px-4 py-4 border-t border-neutral-800/50">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Laporan
                  </h3>
                  <button
                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <Plus className={`w-4 h-4 transition-transform duration-200 ${projectsExpanded ? 'rotate-45' : ''
                      }`} />
                  </button>
                </div>

                {projectsExpanded && (
                  <nav className="space-y-1">
                    {currentProjects.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive
                            ? 'bg-gradient-to-b from-neutral-300/10 via-neutral-300/5 to-neutral-800/20 text-white shadow-lg shadow-black/10'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                            }`}
                        >
                          {/* 1. Neon Indicator Bar (Samping luar) */}
                          {isActive && (
                            <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 shadow-[0_0_15px_#F97316] rounded-r-full" />
                          )}

                          {/* 2. Inner Left Glow (Pantulan cahaya di dalam menu) */}
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-12 border-l-2 border-orange-500/60 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-orange-500/0  rounded-l-xl pointer-events-none" />
                          )}

                          {/* 3. Icon */}
                          <Icon className="w-5 h-5 transition-transform duration-200" />

                          {/* 4. Label */}
                          <span className={`relative z-10 font-semibold text-[14px] transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                            }`}>
                            {item.label}
                          </span>

                          {isActive && (
                            <ChevronRight className="w-5 h-5 ml-auto text-white" />
                          )}
                          {isActive && (
                            <div className="absolute inset-0 border-t border-white/5 rounded-xl pointer-events-none" />
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            )}

            {/* Settings Section */}
            <div className="px-4 py-4 border-t border-neutral-800/50">
              {(() => {
                const isActive = pathname.includes('/settings');

                return (
                  <Link
                    href={`/dashboard/${role}/settings`}
                    onClick={onClose}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-gradient-to-b from-neutral-300/10 via-neutral-300/5 to-neutral-800/20 text-white shadow-lg shadow-black/10'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                      }`}
                  >
                    {/* 1. Neon Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 shadow-[0_0_15px_#F97316] rounded-r-full" />
                    )}

                    {/* 2. Inner Left Glow */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-12 border-l-2 border-orange-500/60 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-orange-500/0 rounded-l-xl pointer-events-none" />
                    )}

                    {/* 3. Icon */}
                    <Settings className="w-5 h-5 transition-transform duration-200" />

                    {/* 4. Label */}
                    <span
                      className={`relative z-10 font-semibold text-[14px] transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                        }`}
                    >
                      Pengaturan
                    </span>

                    {/* 5. Chevron */}
                    {isActive && (
                      <ChevronRight className="w-5 h-5 ml-auto text-white" />
                    )}

                    {/* 6. Subtle top border */}
                    {isActive && (
                      <div className="absolute inset-0 border-t border-white/5 rounded-xl pointer-events-none" />
                    )}
                  </Link>
                );
              })()}
            </div>

          </div>

          {/* Logout */}
          <div className="p-4 border-t border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl
                text-red-400 hover:text-white hover:bg-red-500/10 
                border border-red-500/20 hover:border-red-500/40
                transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}