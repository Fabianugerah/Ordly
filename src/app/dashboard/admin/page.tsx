'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import {
  Users,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMenu: 0,
    totalOrders: 0,
    totalTransaksi: 0,
    pendapatanHariIni: 0,
    orderPending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all data from Supabase
      const [
        { data: users },
        { data: menu },
        { data: orders },
        { data: transaksi },
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('masakan').select('*'),
        supabase.from('order').select('*'),
        supabase.from('transaksi').select('*'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayTransaksi = transaksi?.filter((t) => t.tanggal === today) || [];
      const pendapatanHariIni = todayTransaksi.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      );

      const orderPending = orders?.filter((o) => o.status_order === 'pending').length || 0;

      setStats({
        totalUsers: users?.length || 0,
        totalMenu: menu?.length || 0,
        totalOrders: orders?.length || 0,
        totalTransaksi: transaksi?.length || 0,
        pendapatanHariIni,
        orderPending,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['administrator']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-neutral-400 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Dashboard Administrator</h1>
          <p className="text-neutral-600 mt-1">Selamat Datang Di Halaman Dashboard Administrator.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total User"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
            subtitle="Semua pengguna sistem"
          />
          <StatsCard
            title="Total Menu"
            value={stats.totalMenu}
            icon={UtensilsCrossed}
            color="green"
            subtitle="Menu tersedia"
          />
          <StatsCard
            title="Total Pesanan"
            value={stats.totalOrders}
            icon={ShoppingCart}
            color="amber"
            subtitle="Semua pesanan"
          />
          <StatsCard
            title="Total Transaksi"
            value={stats.totalTransaksi}
            icon={Receipt}
            color="purple"
            subtitle="Pembayaran selesai"
          />
          <StatsCard
            title="Pendapatan Hari Ini"
            value={`Rp ${stats.pendapatanHariIni.toLocaleString('id-ID')}`}
            icon={TrendingUp}
            color="green"
            subtitle={new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
          <StatsCard
            title="Pesanan Pending"
            value={stats.orderPending}
            icon={Clock}
            color="red"
            subtitle="Menunggu diproses"
          />
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/dashboard/admin/users"
              className="p-4 border-2 border-neutral-800 rounded-lg hover:border-orange-500 hover:bg-orange-900/20 transition-colors text-center"
            >
              <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="font-medium text-neutral-200">Kelola User</p>
            </a>
            <a
              href="/dashboard/admin/menu"
              className="p-4 border-2 border-neutral-800 rounded-lg hover:border-orange-500 hover:bg-orange-900/20 transition-colors text-center"
            >
              <UtensilsCrossed className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="font-medium text-neutral-200">Kelola Menu</p>
            </a>
            <a
              href="/dashboard/admin/orders"
              className="p-4 border-2 border-neutral-800 rounded-lg hover:border-orange-500 hover:bg-orange-900/20 transition-colors text-center"
            >
              <ShoppingCart className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="font-medium text-neutral-200">Lihat Pesanan</p>
            </a>
            <a
              href="/dashboard/admin/laporan"
              className="p-4 border-2 border-neutral-800 rounded-lg hover:border-orange-500 hover:bg-orange-900/20 transition-colors text-center"
            >
              <Receipt className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="font-medium text-neutral-200">Lihat Laporan</p>
            </a>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}