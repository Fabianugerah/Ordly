'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LogOut } from 'lucide-react';
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
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const role = user?.level?.nama_level;

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


  // Menu items based on role
  const menuItems = {
    administrator: [
      { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/admin/users', icon: Users, label: 'Manajemen User' },
      { href: '/dashboard/admin/menu', icon: UtensilsCrossed, label: 'Manajemen Menu' },
      { href: '/dashboard/admin/orders', icon: ShoppingCart, label: 'Pesanan' },
      { href: '/dashboard/admin/transaksi', icon: Receipt, label: 'Transaksi' },
      { href: '/dashboard/admin/laporan', icon: FileText, label: 'Laporan' },
    ],
    waiter: [
      { href: '/dashboard/waiter', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/waiter/menu', icon: UtensilsCrossed, label: 'Menu' },
      { href: '/dashboard/waiter/order', icon: ShoppingCart, label: 'Buat Pesanan' },
      { href: '/dashboard/waiter/orders', icon: ShoppingCart, label: 'Daftar Pesanan' },
      { href: '/dashboard/waiter/laporan', icon: FileText, label: 'Laporan' },
    ],
    kasir: [
      { href: '/dashboard/kasir', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/kasir/orders', icon: ShoppingCart, label: 'Pesanan' },
      { href: '/dashboard/kasir/pembayaran', icon: Receipt, label: 'Pembayaran' },
      { href: '/dashboard/kasir/transaksi', icon: Receipt, label: 'Riwayat Transaksi' },
      { href: '/dashboard/kasir/laporan', icon: FileText, label: 'Laporan' },
    ],
    owner: [
      { href: '/dashboard/owner', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/owner/laporan', icon: FileText, label: 'Laporan' },
      { href: '/dashboard/owner/analytics', icon: FileText, label: 'Analytics' },
    ],
    pelanggan: [
      { href: '/dashboard/customer', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/customer/menu', icon: UtensilsCrossed, label: 'Menu' },
      { href: '/dashboard/customer/order', icon: ShoppingCart, label: 'Buat Pesanan' },
      { href: '/dashboard/customer/orders', icon: ShoppingCart, label: 'Pesanan Saya' },
    ],
  };

  const currentMenu = role ? menuItems[role] || [] : [];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 
  bg-white dark:bg-neutral-900 
  border-r border-gray-200 dark:border-neutral-800
  z-40 transform transition-transform duration-300
  ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >

        <nav className="p-4 space-y-2">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}

              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
           text-red-500 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

      </aside>
    </>
  );
}