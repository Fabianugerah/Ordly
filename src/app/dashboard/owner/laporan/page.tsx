'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Download, Star, DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Import Komponen Baru
import DateRangePicker from '@/components/ui/DateRangePicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function OwnerLaporanPage() {
  const [loading, setLoading] = useState(true);
  
  // Menggunakan tipe Date object langsung untuk kompatibilitas dengan komponen baru
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 hari lalu
    endDate: new Date(), // Hari ini
  });
  
  const [reportData, setReportData] = useState({
    summary: { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, avgOrderValue: 0 },
    topMenu: [] as any[],
    revenueByCategory: [] as any[],
    monthlyComparison: [] as any[],
  });

  useEffect(() => {
    // Pastikan kedua tanggal ada sebelum fetch
    if (dateRange.startDate && dateRange.endDate) {
      fetchReportData();
    }
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Konversi Date object ke string format YYYY-MM-DD untuk query database
      // Tambahkan check null safety
      if (!dateRange.startDate || !dateRange.endDate) return;

      const startStr = new Intl.DateTimeFormat('en-CA').format(dateRange.startDate);
      const endStr = new Intl.DateTimeFormat('en-CA').format(dateRange.endDate);

      // --- LOGIKA FETCH DATA SAMA SEPERTI SEBELUMNYA ---
      // Fetch orders
      const { data: orders } = await supabase
        .from('order')
        .select('*')
        .gte('tanggal', startStr)
        .lte('tanggal', endStr)
        .eq('status_order', 'selesai');

      // Fetch transactions
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', startStr)
        .lte('tanggal', endStr);

      // Fetch detail orders
      const { data: detailOrders } = await supabase
        .from('detail_order')
        .select('*, masakan(*), order!inner(tanggal, status_order)')
        .gte('order.tanggal', startStr)
        .lte('order.tanggal', endStr)
        .eq('order.status_order', 'selesai');

      // Calculate summary
      const totalRevenue = transaksi?.reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalCustomers = new Set(orders?.map((o) => o.id_user)).size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate top menu
      const menuSales: { [key: number]: { total: number; revenue: number; masakan: any } } = {};
      detailOrders?.forEach((detail) => {
        if (detail.id_masakan && detail.masakan) {
          if (!menuSales[detail.id_masakan]) {
            menuSales[detail.id_masakan] = { total: 0, revenue: 0, masakan: detail.masakan };
          }
          menuSales[detail.id_masakan].total += detail.jumlah;
          menuSales[detail.id_masakan].revenue += parseFloat(detail.subtotal.toString());
        }
      });

      const topMenu = Object.values(menuSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Revenue by category
      const categoryRevenue: { [key: string]: number } = {};
      detailOrders?.forEach((detail) => {
        const category = detail.masakan?.kategori || 'Lainnya';
        if (!categoryRevenue[category]) categoryRevenue[category] = 0;
        categoryRevenue[category] += parseFloat(detail.subtotal.toString());
      });

      const revenueByCategory = Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      setReportData({
        summary: { totalRevenue, totalOrders, totalCustomers, avgOrderValue },
        topMenu,
        revenueByCategory,
        monthlyComparison: [],
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  // Helper Stat Card (Tetap sama)
  const StatCard = ({ title, value, icon: Icon, bgClass }: any) => (
    <Card className="relative overflow-hidden border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bgClass}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </Card>
  );

  return (
    <DashboardLayout allowedRoles={['owner']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Laporan Bisnis</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Ringkasan performa restoran</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>

        {/* Filter Section - Menggunakan Komponen DateRangePicker Baru */}
        <Card className="p-4 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Komponen Date Picker Kustom */}
            <DateRangePicker 
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
            />

            {/* Tombol Action (Opsional karena useEffect sudah auto-fetch) */}
            <div className="flex gap-2">
               <Button onClick={() => fetchReportData()} className="h-[42px] px-6">
                  Refresh Data
               </Button>
            </div>

          </div>
        </Card>

        {loading ? (
           <div className="flex items-center justify-center h-64">
             <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
           </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Pendapatan" 
                value={`Rp ${(reportData.summary.totalRevenue / 1000000).toFixed(1)}jt`}
                icon={DollarSign}
                bgClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <StatCard 
                title="Total Pesanan" 
                value={reportData.summary.totalOrders}
                icon={ShoppingCart}
                bgClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard 
                title="Total Pelanggan" 
                value={reportData.summary.totalCustomers}
                icon={Users}
                bgClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              />
              <StatCard 
                title="Rata-rata Order" 
                value={`Rp ${(reportData.summary.avgOrderValue / 1000).toFixed(0)}k`}
                icon={TrendingUp}
                bgClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              />
            </div>

            {/* Charts & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top Menu List */}
              <Card title="Top 10 Menu Terlaris">
                {reportData.topMenu.length === 0 ? (
                  <p className="text-center text-neutral-500 py-8">Tidak ada data pada periode ini</p>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {reportData.topMenu.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${idx < 3 ? 'bg-orange-500' : 'bg-neutral-400'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-800 dark:text-white truncate">
                            {item.masakan?.nama_masakan}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {item.total} porsi • {item.masakan?.kategori}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                            Rp {(item.revenue / 1000).toFixed(0)}k
                          </p>
                          {idx < 3 && (
                            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-amber-500 uppercase">
                                <Star className="w-3 h-3 fill-current" /> Top
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Revenue by Category Chart */}
              <Card title="Pendapatan per Kategori">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.revenueByCategory} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" opacity={0.5} />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="category" 
                                type="category" 
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 12, fill: '#6B7280'}}
                                width={80}
                            />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={30}>
                                {reportData.revenueByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </Card>

            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}