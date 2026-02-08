'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  Receipt,
  Clock 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Import Recharts
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    pendapatanBulanIni: 0,
    totalTransaksi: 0,
    totalPesanan: 0,
    totalPelanggan: 0,
    revenueGrowth: 0, 
    transaksiGrowth: 0,
    pesananGrowth: 0,
    pelangganGrowth: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [topMenu, setTopMenu] = useState<any[]>([]);
  // Tambahkan state untuk recent orders
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();
      const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfLastMonth = new Date(currentYear, currentMonth, 0).toISOString();

      // 1. Fetch Data Bulan Ini
      const { data: currTrans } = await supabase.from('transaksi').select('total_bayar, id_user').gte('tanggal', startOfMonth).lte('tanggal', endOfMonth);
      const { data: currOrders } = await supabase.from('order').select('id_order').gte('tanggal', startOfMonth).lte('tanggal', endOfMonth);
      
      // 2. Fetch Data Bulan Lalu
      const { data: prevTrans } = await supabase.from('transaksi').select('total_bayar, id_user').gte('tanggal', startOfLastMonth).lte('tanggal', endOfLastMonth);
      const { data: prevOrders } = await supabase.from('order').select('id_order').gte('tanggal', startOfLastMonth).lte('tanggal', endOfLastMonth);

      // 3. Fetch Detail Order (Top Menu)
      const { data: detailOrders } = await supabase
        .from('detail_order')
        .select('*, masakan(*), order!inner(tanggal)')
        .gte('order.tanggal', startOfMonth)
        .lte('order.tanggal', endOfMonth);

      // 4. Fetch Recent Orders (5 Terakhir) -- TAMBAHAN
      const { data: latestOrders } = await supabase
        .from('order')
        .select('*, users(nama_user)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(latestOrders || []);

      // --- HITUNG METRIK ---
      const revCurr = currTrans?.reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0) || 0;
      const revPrev = prevTrans?.reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0) || 0;
      const transCurr = currTrans?.length || 0;
      const transPrev = prevTrans?.length || 0;
      const ordCurr = currOrders?.length || 0;
      const ordPrev = prevOrders?.length || 0;
      const custCurr = new Set(currTrans?.map(t => t.id_user)).size;
      const custPrev = new Set(prevTrans?.map(t => t.id_user)).size;

      setStats({
        pendapatanBulanIni: revCurr,
        totalTransaksi: transCurr,
        totalPesanan: ordCurr,
        totalPelanggan: custCurr,
        revenueGrowth: calculateGrowth(revCurr, revPrev),
        transaksiGrowth: calculateGrowth(transCurr, transPrev),
        pesananGrowth: calculateGrowth(ordCurr, ordPrev),
        pelangganGrowth: calculateGrowth(custCurr, custPrev),
      });

      // --- TOP MENU LOGIC ---
      const menuSales: { [key: number]: { total: number; revenue: number; masakan: any } } = {};
      detailOrders?.forEach((detail) => {
        if (detail.id_masakan) {
          if (!menuSales[detail.id_masakan]) {
            menuSales[detail.id_masakan] = { total: 0, revenue: 0, masakan: detail.masakan };
          }
          menuSales[detail.id_masakan].total += detail.jumlah;
          menuSales[detail.id_masakan].revenue += parseFloat(detail.subtotal.toString());
        }
      });
      const topMenuArray = Object.values(menuSales).sort((a, b) => b.total - a.total).slice(0, 5);
      setTopMenu(topMenuArray);

      // --- CHART DATA LOGIC (7 Hari Terakhir) ---
      const { data: chartTrans } = await supabase.from('transaksi').select('*').gte('tanggal', new Date(now.setDate(now.getDate() - 7)).toISOString());
      const last7Days = [];
      const tempNow = new Date(); 
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(tempNow.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayTransaksi = chartTrans?.filter((t) => t.tanggal === dateStr) || [];
        const dayRevenue = dayTransaksi.reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0);
        last7Days.push({
          date: dateStr,
          formattedDate: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          revenue: dayRevenue,
        });
      }
      setChartData(last7Days);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'selesai': return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
        case 'proses': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
        case 'pending': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
        default: return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['owner']}>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { title: 'Pendapatan Bulan Ini', value: `Rp ${(stats.pendapatanBulanIni / 1000).toLocaleString('id-ID')}k`, subtitle: 'vs bulan lalu', icon: DollarSign, iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', growth: stats.revenueGrowth },
    { title: 'Total Transaksi', value: stats.totalTransaksi.toLocaleString(), subtitle: 'Bulan ini', icon: TrendingUp, iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', growth: stats.transaksiGrowth },
    { title: 'Total Pesanan', value: stats.totalPesanan.toLocaleString(), subtitle: 'Bulan ini', icon: ShoppingCart, iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', growth: stats.pesananGrowth },
    { title: 'Pelanggan Aktif', value: stats.totalPelanggan.toLocaleString(), subtitle: 'Bulan ini', icon: Users, iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', growth: stats.pelangganGrowth },
  ];

  return (
    <DashboardLayout allowedRoles={['owner']}>
      <div className="space-y-8 pb-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Dashboard Owner</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Ringkasan performa bisnis bulan ini ({new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const isPositive = stat.growth >= 0;
            return (
              <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</h3>
                    <div className="flex items-center gap-1.5 mt-3">
                      <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                        {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                        {Math.abs(stat.growth).toFixed(1)}%
                      </span>
                      <span className="text-xs text-neutral-400">{stat.subtitle}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.iconBg}`}><stat.icon className="w-6 h-6" /></div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts & Top Menu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Tren Pendapatan</h3>
                <p className="text-sm text-neutral-500">7 hari terakhir</p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenueOwner" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                  <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueOwner)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Menu List */}
          <Card>
            <h3 className="text-lg font-bold mb-6 text-neutral-800 dark:text-white">Menu Terlaris (Bulan Ini)</h3>
            {topMenu.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                <Receipt className="w-12 h-12 mb-2 opacity-20" />
                <p>Belum ada data penjualan</p>
              </div>
            ) : (
              <div className="space-y-1">
                {topMenu.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors group">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm shadow-sm flex-shrink-0 ${idx === 0 ? 'bg-orange-500 text-white' : idx === 1 ? 'bg-neutral-700 text-white' : idx === 2 ? 'bg-neutral-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-800 dark:text-white truncate">{item.masakan?.nama_masakan || 'Unknown'}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.total} porsi terjual</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600 dark:text-green-400">Rp {(item.revenue / 1000).toFixed(0)}k</p>
                      {idx === 0 && (<div className="flex items-center justify-end gap-1 text-[10px] font-bold text-orange-500 uppercase mt-0.5"><Star className="w-3 h-3 fill-current" /> Top</div>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* --- SECTION BARU: RECENT ORDERS --- */}
        <Card className="border border-neutral-200 dark:border-neutral-800 p-0 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                <div>
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Pesanan Masuk Terbaru</h3>
                    <p className="text-sm text-neutral-500">Monitor pesanan yang sedang berlangsung atau baru selesai</p>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Waktu</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Pelanggan</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Meja</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                        {recentOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 italic">
                                    Belum ada pesanan terbaru hari ini.
                                </td>
                            </tr>
                        ) : (
                            recentOrders.map((order) => (
                                <tr key={order.id_order} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900 dark:text-white">
                                        #{order.id_order}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-400">
                                                {order.users?.nama_user?.charAt(0).toUpperCase() || 'G'}
                                            </div>
                                            <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                                                {order.users?.nama_user || 'Guest'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                        <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs font-semibold">
                                            Meja {order.no_meja}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status_order)}`}>
                                            {order.status_order}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-800 dark:text-white text-right">
                                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}