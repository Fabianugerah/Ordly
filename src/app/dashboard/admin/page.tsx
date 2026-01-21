'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import {
  Users,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Clock,
  ArrowUp,
  ArrowDown,
  DollarSign,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Import Recharts untuk grafik
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMenu: 0,
    totalOrders: 0,
    totalTransaksi: 0,
    pendapatanHariIni: 0,
    orderPending: 0,
    usersGrowth: 12.5,
    ordersGrowth: 8.3,
    revenueGrowth: 15.7,
  });
  
  // State tambahan untuk data chart
  const [chartData, setChartData] = useState({
    revenueByDate: [] as any[],
    hourlyOrders: [] as any[],
  });

  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch data dasar dan detail_order untuk grafik pola jam
      const [
        { data: users },
        { data: menu },
        { data: orders },
        { data: transaksi },
        { data: detailOrders }
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('masakan').select('*'),
        supabase.from('order').select('*'),
        supabase.from('transaksi').select('*'),
        supabase.from('detail_order').select('*, order!inner(created_at, tanggal)')
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
        usersGrowth: 12.5,
        ordersGrowth: 8.3,
        revenueGrowth: 15.7,
      });

      // --- LOGIKA CHART (DARI HALAMAN LAPORAN) ---
      
      // 1. Proses Tren Pendapatan (7 Hari Terakhir)
      const revenueMap: { [key: string]: number } = {};
      transaksi?.forEach((t) => {
        if (!revenueMap[t.tanggal]) revenueMap[t.tanggal] = 0;
        revenueMap[t.tanggal] += parseFloat(t.total_bayar);
      });

      const revenueByDate = Object.entries(revenueMap)
        .map(([date, revenue]) => ({
          date,
          revenue,
          formattedDate: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Ambil 7 data terakhir

      // 2. Proses Pola Jam
      const hourlyMap: { [key: number]: number } = {};
      detailOrders?.forEach((detail) => {
        if (detail.order?.created_at) {
          const hour = new Date(detail.order.created_at).getHours();
          if (!hourlyMap[hour]) hourlyMap[hour] = 0;
          hourlyMap[hour]++;
        }
      });

      const hourlyOrders = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        orders: hourlyMap[i] || 0,
      }));

      setChartData({ revenueByDate, hourlyOrders });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data } = await supabase
        .from('order')
        .select('*, users:id_user(nama_user)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
      proses: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      selesai: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      dibatalkan: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    };
    return colors[status as keyof typeof colors] || 'text-neutral-600 bg-neutral-100';
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['administrator']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Pendapatan',
      value: `Rp ${(stats.pendapatanHariIni / 1000).toFixed(0)}k`,
      subtitle: 'Hari Ini',
      icon: DollarSign,
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      growth: stats.revenueGrowth,
      isPositive: true,
    },
    {
      title: 'Total Pesanan',
      value: stats.totalOrders,
      subtitle: 'Semua Waktu',
      icon: ShoppingCart,
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-600',
      growth: stats.ordersGrowth,
      isPositive: true,
    },
    {
      title: 'Pending Orders',
      value: stats.orderPending,
      subtitle: 'Perlu Diproses',
      icon: Clock,
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      growth: -2.4,
      isPositive: false,
    },
    {
      title: 'Total User',
      value: stats.totalUsers,
      subtitle: 'Pengguna Aktif',
      icon: Users,
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      growth: stats.usersGrowth,
      isPositive: true,
    },
    {
      title: 'Total Menu',
      value: stats.totalMenu,
      subtitle: 'Item Tersedia',
      icon: UtensilsCrossed,
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
      growth: 5.2,
      isPositive: true,
    },
    {
      title: 'Total Transaksi',
      value: stats.totalTransaksi,
      subtitle: 'Pembayaran Selesai',
      icon: Receipt,
      iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      growth: 18.9,
      isPositive: true,
    },
  ];

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
            Dashboard Administrator
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Selamat datang! Berikut ringkasan sistem restoran Anda.
          </p>
        </div>

        {/* Stats Grid - Tetap Sesuai Style Asli */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    {stat.subtitle}
                  </p>
                  
                  <div className="flex items-center gap-1 mt-3">
                    {stat.isPositive ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        stat.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {Math.abs(stat.growth)}%
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      vs bulan lalu
                    </span>
                  </div>
                </div>

                <div
                  className={`${stat.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Card>
          ))}
        </div>

        {/* --- ADDED CHARTS SECTION (FROM LAPORAN) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Tren Pendapatan Harian</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.revenueByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="formattedDate" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Pola Pesanan per Jam</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.hourlyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="hour" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [`${value} pesanan`, 'Total']}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Orders - Tetap Sesuai Style Asli */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Pesanan Terbaru
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    5 pesanan terakhir
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/admin/orders"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400"
              >
                Lihat Semua →
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b dark:border-neutral-800">
                    <th className="px-4 py-3">ID Order</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-neutral-800">
                  {recentOrders.map((order) => (
                    <tr key={order.id_order} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">#{order.id_order}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{order.users?.nama_user}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(order.status_order)}`}>
                          {order.status_order}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}