'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  ArrowUp, 
  ArrowDown,
  Award,
  Clock,
  PieChart as PieIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Import Recharts
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function OwnerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // Periode untuk Kartu Statistik (default 30 hari)
  
  const [analytics, setAnalytics] = useState({
    // Statistik Utama (Ikut Filter Periode)
    revenue: { current: 0, previous: 0, growth: 0 },
    orders: { current: 0, previous: 0, growth: 0 },
    avgOrderValue: { current: 0, previous: 0, growth: 0 },
    customers: { current: 0, previous: 0, growth: 0 },
    
    // Data Visualisasi
    revenueChart7Days: [] as any[], // Khusus Chart (Fixed 7 Hari)
    topStaff: [] as any[],          // Performa Staff
    salesByCategory: [] as any[],   // Pie Chart Kategori
    peakHours: [] as any[],         // Jam Sibuk
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = parseInt(period);
      const today = new Date();
      
      // --- 1. SETUP TANGGAL UNTUK STATISTIK (Sesuai Filter) ---
      const currentStart = new Date(today);
      currentStart.setDate(today.getDate() - days);
      
      const previousEnd = new Date(currentStart);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - days);

      // --- 2. FETCH DATA PERIODE INI ---
      const { data: currentTransaksi } = await supabase
        .from('transaksi')
        .select('*, users(nama_user)')
        .gte('tanggal', currentStart.toISOString().split('T')[0])
        .lte('tanggal', today.toISOString().split('T')[0]);

      const { data: currentOrders } = await supabase
        .from('order')
        .select('*')
        .gte('tanggal', currentStart.toISOString().split('T')[0])
        .lte('tanggal', today.toISOString().split('T')[0])
        .eq('status_order', 'selesai');

      // --- 3. FETCH DATA PERIODE SEBELUMNYA (Untuk Growth) ---
      const { data: previousTransaksi } = await supabase
        .from('transaksi')
        .select('total_bayar')
        .gte('tanggal', previousStart.toISOString().split('T')[0])
        .lt('tanggal', currentStart.toISOString().split('T')[0]);

      const { data: previousOrders } = await supabase
        .from('order')
        .select('id_order, id_user')
        .gte('tanggal', previousStart.toISOString().split('T')[0])
        .lt('tanggal', currentStart.toISOString().split('T')[0])
        .eq('status_order', 'selesai');

      // --- 4. HITUNG METRIK UTAMA ---
      const currRev = currentTransaksi?.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0) || 0;
      const prevRev = previousTransaksi?.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0) || 0;
      
      const currOrd = currentOrders?.length || 0;
      const prevOrd = previousOrders?.length || 0;

      const currCust = new Set(currentOrders?.map(o => o.id_user)).size;
      const prevCust = new Set(previousOrders?.map(o => o.id_user)).size;

      const calculateGrowth = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

      // --- 5. DATA CHART REVENUE (FIXED 7 HARI TERAKHIR) ---
      // Kita fetch khusus untuk chart agar selalu realtime 7 hari
      const chartStart = new Date(today);
      chartStart.setDate(today.getDate() - 6); // 7 hari termasuk hari ini
      
      const { data: chartTransaksi } = await supabase
        .from('transaksi')
        .select('tanggal, total_bayar')
        .gte('tanggal', chartStart.toISOString().split('T')[0]);

      const revenueMap7Days: { [key: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        revenueMap7Days[d.toISOString().split('T')[0]] = 0;
      }
      chartTransaksi?.forEach(t => {
        if (revenueMap7Days[t.tanggal] !== undefined) revenueMap7Days[t.tanggal] += parseFloat(t.total_bayar);
      });
      const revenueChart7Days = Object.entries(revenueMap7Days).map(([date, val]) => ({
        date,
        formattedDate: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue: val
      })).sort((a, b) => a.date.localeCompare(b.date));

      // --- 6. PERFORMA STAFF (Top Cashier/Waiter) ---
      const staffMap: { [key: string]: number } = {};
      currentTransaksi?.forEach(t => {
        const name = t.users?.nama_user || 'Unknown';
        staffMap[name] = (staffMap[name] || 0) + 1; // Hitung jumlah transaksi yg dihandle
      });
      const topStaff = Object.entries(staffMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // --- 7. KATEGORI SALES (Pie Chart) ---
      const { data: detailData } = await supabase
        .from('detail_order')
        .select('subtotal, masakan(kategori)')
        .gte('created_at', currentStart.toISOString()); // Ambil detail order sesuai periode filter

      const catMap: { [key: string]: number } = {};
      detailData?.forEach((d: any) => {
        const cat = d.masakan?.kategori || 'Lainnya';
        catMap[cat] = (catMap[cat] || 0) + parseFloat(d.subtotal);
      });
      const salesByCategory = Object.entries(catMap).map(([name, value]) => ({ name, value }));

      // --- 8. JAM SIBUK (Peak Hours) ---
      const hourMap: { [key: number]: number } = {};
      // Inisialisasi jam operasional 08-22
      for(let i=8; i<=22; i++) hourMap[i] = 0;
      
      currentTransaksi?.forEach(t => {
        const hour = new Date(t.created_at).getHours();
        if (hourMap[hour] !== undefined) hourMap[hour]++;
      });
      const peakHours = Object.entries(hourMap).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count
      }));

      setAnalytics({
        revenue: { current: currRev, previous: prevRev, growth: calculateGrowth(currRev, prevRev) },
        orders: { current: currOrd, previous: prevOrd, growth: calculateGrowth(currOrd, prevOrd) },
        avgOrderValue: { 
            current: currOrd ? currRev/currOrd : 0, 
            previous: prevOrd ? prevRev/prevOrd : 0, 
            growth: calculateGrowth((currOrd ? currRev/currOrd : 0), (prevOrd ? prevRev/prevOrd : 0)) 
        },
        customers: { current: currCust, previous: prevCust, growth: calculateGrowth(currCust, prevCust) },
        revenueChart7Days,
        topStaff,
        salesByCategory,
        peakHours
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Warna Chart
  const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6'];

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
    {
      title: 'Total Revenue',
      value: `Rp ${(analytics.revenue.current / 1000000).toFixed(1)}jt`,
      growth: analytics.revenue.growth,
      icon: DollarSign,
      iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      title: 'Total Orders',
      value: analytics.orders.current.toLocaleString(),
      growth: analytics.orders.growth,
      icon: ShoppingCart,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      title: 'Avg Order Value',
      value: `Rp ${(analytics.avgOrderValue.current / 1000).toFixed(0)}k`,
      growth: analytics.avgOrderValue.growth,
      icon: TrendingUp,
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      title: 'Active Customers',
      value: analytics.customers.current.toLocaleString(),
      growth: analytics.customers.growth,
      icon: Users,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
  ];

  return (
    <DashboardLayout allowedRoles={['owner']}>
      <div className="space-y-8 pb-10">
        
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Business Analytics</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Laporan performa bisnis dalam <span className="font-semibold text-orange-600">{period} hari terakhir</span>.
            </p>
          </div>
          <div className="flex bg-white dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            {['7', '30', '90'].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  period === days 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {days} Hari
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
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
                                <span className="text-xs text-neutral-400">vs periode lalu</span>
                            </div>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
             );
          })}
        </div>

        {/* MAIN CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Trend Chart (Fixed 7 Days) */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Tren Pendapatan Mingguan</h3>
                <p className="text-sm text-neutral-500">7 hari terakhir (Realtime)</p>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueChart7Days}>
                  <defs>
                    <linearGradient id="colorRevenueOwner" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
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
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#F97316" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenueOwner)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Sales by Category (Pie Chart) */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Kategori Terlaris</h3>
              <p className="text-sm text-neutral-500">Distribusi penjualan</p>
            </div>
            <div className="h-[320px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Total Sales']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                 <PieIcon className="w-6 h-6 text-neutral-300 mx-auto" />
              </div>
            </div>
          </Card>
        </div>

        {/* BOTTOM SECTION: Staff & Peak Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Staff Performance */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Top Performa Staff
                    </h3>
                </div>
                {analytics.topStaff.length === 0 ? (
                    <p className="text-center text-neutral-500 py-8">Belum ada data staf</p>
                ) : (
                    <div className="space-y-4">
                        {analytics.topStaff.map((staff, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${idx===0?'bg-yellow-500':idx===1?'bg-gray-400':'bg-orange-400'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-semibold text-neutral-800 dark:text-white">{staff.name}</span>
                                        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{staff.count} Transaksi</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                                        <div 
                                            className="bg-orange-500 h-2 rounded-full" 
                                            style={{ width: `${(staff.count / analytics.topStaff[0].count) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Peak Hours (Bar Chart) */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Jam Tersibuk
                    </h3>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.peakHours}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>

      </div>
    </DashboardLayout>
  );
}