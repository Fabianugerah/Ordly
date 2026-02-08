'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import {
  Users,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  Clock,
  ArrowUp,
  ArrowDown,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMenu: 0,
    totalOrders: 0,
    totalTransaksi: 0,
    pendapatanHariIni: 0,
    orderPending: 0,
    // Growth stats (akan dihitung dinamis)
    usersGrowth: 0,
    ordersGrowth: 0,
    revenueGrowth: 0,
    transaksiGrowth: 0,
  });
  
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

  // Helper untuk menghitung persentase pertumbuhan
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0; // Jika kemarin 0, hari ini ada, anggap 100%
    return ((current - previous) / previous) * 100;
  };

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [
        { data: users },
        { data: menu },
        { data: orders },
        { data: transaksi },
        { data: detailOrders }
      ] = await Promise.all([
        supabase.from('users').select('created_at'), // Hanya butuh created_at untuk growth user
        supabase.from('masakan').select('id_masakan'),
        supabase.from('order').select('created_at, status_order'),
        supabase.from('transaksi').select('tanggal, total_bayar'),
        supabase.from('detail_order').select('*, order!inner(created_at, tanggal)')
      ]);

      // --- 1. SETUP TANGGAL ---
      const todayDate = new Date();
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);

      const todayStr = todayDate.toISOString().split('T')[0];
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      // --- 2. HITUNG PENDAPATAN (REVENUE) ---
      const todayTransaksi = transaksi?.filter((t) => t.tanggal === todayStr) || [];
      const yesterdayTransaksi = transaksi?.filter((t) => t.tanggal === yesterdayStr) || [];

      const revenueToday = todayTransaksi.reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0);
      const revenueYesterday = yesterdayTransaksi.reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0);
      
      const revenueGrowth = calculateGrowth(revenueToday, revenueYesterday);

      // --- 3. HITUNG PESANAN (ORDERS) ---
      // Kita hitung growth berdasarkan JUMLAH ORDER BARU hari ini vs kemarin
      const ordersToday = orders?.filter((o) => o.created_at.startsWith(todayStr)).length || 0;
      const ordersYesterday = orders?.filter((o) => o.created_at.startsWith(yesterdayStr)).length || 0;
      
      const ordersGrowth = calculateGrowth(ordersToday, ordersYesterday);

      // --- 4. HITUNG USER BARU ---
      const usersToday = users?.filter((u) => u.created_at.startsWith(todayStr)).length || 0;
      const usersYesterday = users?.filter((u) => u.created_at.startsWith(yesterdayStr)).length || 0;

      const usersGrowth = calculateGrowth(usersToday, usersYesterday);

      // --- 5. HITUNG TRANSAKSI (RECEIPT) ---
      const txTodayCount = todayTransaksi.length;
      const txYesterdayCount = yesterdayTransaksi.length;
      const transaksiGrowth = calculateGrowth(txTodayCount, txYesterdayCount);

      const orderPending = orders?.filter((o) => o.status_order === 'pending').length || 0;

      setStats({
        totalUsers: users?.length || 0,
        totalMenu: menu?.length || 0,
        totalOrders: orders?.length || 0,
        totalTransaksi: transaksi?.length || 0,
        pendapatanHariIni: revenueToday,
        orderPending,
        usersGrowth,
        ordersGrowth,
        revenueGrowth,
        transaksiGrowth
      });

      // --- 6. DATA CHART ---
      // Revenue Chart
      const revenueMap: { [key: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          revenueMap[dateStr] = 0;
      }
      transaksi?.forEach((t) => {
        if (revenueMap[t.tanggal] !== undefined) {
            revenueMap[t.tanggal] += parseFloat(t.total_bayar);
        }
      });
      const revenueByDate = Object.entries(revenueMap)
        .map(([date, revenue]) => ({
          date,
          revenue,
          formattedDate: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Hourly Chart
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
      })).filter((_, i) => i >= 8 && i <= 22);

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
      pending: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      proses: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      selesai: 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
      dibatalkan: 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    };
    return colors[status as keyof typeof colors] || 'text-neutral-600 bg-neutral-100 border-neutral-200';
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['administrator']}>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Pendapatan Hari Ini',
      value: `Rp ${(stats.pendapatanHariIni / 1000).toLocaleString('id-ID')}k`,
      subtitle: 'vs kemarin', // Label perbandingan
      icon: DollarSign,
      iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      growth: stats.revenueGrowth,
      isPositive: stats.revenueGrowth >= 0,
    },
    {
      title: 'Total Pesanan',
      value: stats.totalOrders, // Menampilkan total semua, tapi growthnya berdasarkan "Hari ini vs Kemarin"
      subtitle: 'Tren harian',
      icon: ShoppingCart,
      iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      growth: stats.ordersGrowth,
      isPositive: stats.ordersGrowth >= 0,
    },
    {
      title: 'Pending Orders',
      value: stats.orderPending,
      subtitle: 'Perlu Diproses',
      icon: Clock,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      growth: 0, // Pending biasanya tidak butuh growth percentage, atau bisa dibuat statis
      isPositive: true,
      hideGrowth: true // Custom flag buat hide persentase kalau mau
    },
    {
      title: 'Total User',
      value: stats.totalUsers,
      subtitle: 'Pengguna baru harian',
      icon: Users,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      growth: stats.usersGrowth,
      isPositive: stats.usersGrowth >= 0,
    },
    {
      title: 'Total Menu',
      value: stats.totalMenu,
      subtitle: 'Item Tersedia',
      icon: UtensilsCrossed,
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      growth: 0, // Menu jarang berubah harian
      isPositive: true,
      hideGrowth: true
    },
    {
      title: 'Transaksi Selesai',
      value: stats.totalTransaksi,
      subtitle: 'Tren harian',
      icon: Receipt,
      iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
      growth: stats.transaksiGrowth,
      isPositive: stats.transaksiGrowth >= 0,
    },
  ];

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
            Dashboard Administrator
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Ringkasan performa & aktivitas restoran hari ini.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border border-neutral-100 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {stat.value}
                  </h3>
                  
                  {/* Hanya tampilkan growth jika tidak di-hide */}
                  {!stat.hideGrowth && (
                    <div className="flex items-center gap-1.5 mt-3">
                      <span
                        className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${
                          stat.isPositive 
                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20' 
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20'
                        }`}
                      >
                        {stat.isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                        {Math.abs(stat.growth).toFixed(1)}%
                      </span>
                      <span className="text-xs text-neutral-400">
                        {stat.subtitle}
                      </span>
                    </div>
                  )}
                  {stat.hideGrowth && (
                     <div className="mt-3 text-xs text-neutral-400">
                        {stat.subtitle}
                     </div>
                  )}
                </div>

                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Tren Pendapatan</h3>
                <p className="text-sm text-neutral-500">7 hari terakhir</p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.revenueByDate}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                  <XAxis 
                    dataKey="formattedDate" 
                    axisLine={false}
                    tickLine={false}
                    tick={{fontSize: 12, fill: '#9CA3AF'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{fontSize: 12, fill: '#9CA3AF'}}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px', 
                      color: '#fff',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Jam Sibuk</h3>
              <p className="text-sm text-neutral-500">Pola pesanan per jam</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.hourlyOrders} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="hour" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    tick={{fontSize: 11, fill: '#6B7280'}}
                    width={40}
                  />
                  <Tooltip
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#F97316" 
                    radius={[0, 4, 4, 0]} 
                    barSize={15}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="border border-neutral-200 dark:border-neutral-800 p-0 overflow-hidden">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
            <div>
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Pesanan Terbaru</h3>
              <p className="text-sm text-neutral-500">Monitor transaksi yang baru masuk</p>
            </div>
            <a href="/dashboard/admin/orders" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
              Lihat Semua
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Pelanggan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {recentOrders.map((order) => (
                  <tr key={order.id_order} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900 dark:text-white">
                      #{order.id_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                      {order.users?.nama_user || 'Guest'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-800 dark:text-white">
                      Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status_order)}`}>
                        {order.status_order}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 italic">
                      Belum ada pesanan terbaru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}