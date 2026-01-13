'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Download,
  Star,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Banknote,
  CreditCard,
  Smartphone,
  Clock,
  RefreshCw,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminLaporanPage() {
  const [loading, setLoading] = useState(true);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentStartMonth, setCurrentStartMonth] = useState(new Date());
  const [currentEndMonth, setCurrentEndMonth] = useState(new Date());
  const startDatePickerRef = useRef<HTMLDivElement>(null);
  const endDatePickerRef = useRef<HTMLDivElement>(null);

  const [reportData, setReportData] = useState({
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      totalTransaksi: 0,
      avgOrderValue: 0,
      revenueGrowth: 0,
      orderGrowth: 0,
    },
    revenueByDate: [] as any[],
    topMenu: [] as any[],
    ordersByStatus: {
      pending: 0,
      proses: 0,
      selesai: 0,
      dibatalkan: 0,
    },
    paymentMethods: {
      tunai: 0,
      debit: 0,
      qris: 0,
    },
    hourlyOrders: [] as any[],
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  useEffect(() => { fetchReportData(); }, [dateRange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startDatePickerRef.current && !startDatePickerRef.current.contains(event.target as Node)) {
        setShowStartDatePicker(false);
      }
      if (endDatePickerRef.current && !endDatePickerRef.current.contains(event.target as Node)) {
        setShowEndDatePicker(false);
      }
    };
    if (showStartDatePicker || showEndDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStartDatePicker, showEndDatePicker]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day));
    return days;
  };

  const handleDateClick = (date: Date, type: 'start' | 'end') => {
    if (type === 'start') {
      setDateRange({ ...dateRange, startDate: date });
      setShowStartDatePicker(false);
    } else {
      setDateRange({ ...dateRange, endDate: date });
      setShowEndDatePicker(false);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const startDateStr = new Intl.DateTimeFormat('en-CA').format(dateRange.startDate);
      const endDateStr = new Intl.DateTimeFormat('en-CA').format(dateRange.endDate);

      // Fetch orders
      const { data: orders } = await supabase
        .from('order')
        .select('*')
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr);

      // Fetch previous period for growth calculation
      const daysDiff = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(dateRange.startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
      const prevStartDateStr = new Intl.DateTimeFormat('en-CA').format(prevStartDate);

      const { data: prevOrders } = await supabase
        .from('order')
        .select('*')
        .gte('tanggal', prevStartDateStr)
        .lt('tanggal', startDateStr);

      // Fetch transactions
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr);

      const { data: prevTransaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', prevStartDateStr)
        .lt('tanggal', startDateStr);

      // Fetch detail orders with menu
      const { data: detailOrders } = await supabase
        .from('detail_order')
        .select('*, masakan(*), order!inner(tanggal, created_at)')
        .gte('order.tanggal', startDateStr)
        .lte('order.tanggal', endDateStr);

      // Calculate overview
      const totalRevenue = transaksi?.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0) || 0;
      const prevRevenue = prevTransaksi?.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0) || 0;
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const orderGrowth = prevOrders?.length ? ((orders?.length || 0) - prevOrders.length) / prevOrders.length * 100 : 0;

      const overview = {
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalTransaksi: transaksi?.length || 0,
        avgOrderValue: orders?.length ? totalRevenue / orders.length : 0,
        revenueGrowth,
        orderGrowth,
      };

      // Calculate revenue by date
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
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate hourly orders
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

      // Calculate top menu
      const menuSales: { [key: number]: { total: number; revenue: number; masakan: any } } = {};
      detailOrders?.forEach((detail) => {
        if (detail.id_masakan) {
          if (!menuSales[detail.id_masakan]) {
            menuSales[detail.id_masakan] = { total: 0, revenue: 0, masakan: detail.masakan };
          }
          menuSales[detail.id_masakan].total += detail.jumlah;
          menuSales[detail.id_masakan].revenue += parseFloat(detail.subtotal);
        }
      });

      const topMenu = Object.values(menuSales).sort((a, b) => b.total - a.total).slice(0, 5);

      // Calculate orders by status
      const ordersByStatus = {
        pending: orders?.filter((o) => o.status_order === 'pending').length || 0,
        proses: orders?.filter((o) => o.status_order === 'proses').length || 0,
        selesai: orders?.filter((o) => o.status_order === 'selesai').length || 0,
        dibatalkan: orders?.filter((o) => o.status_order === 'dibatalkan').length || 0,
      };

      // Calculate payment methods
      const paymentMethods = {
        tunai: transaksi?.filter((t) => t.metode_pembayaran === 'tunai').length || 0,
        debit: transaksi?.filter((t) => t.metode_pembayaran === 'debit').length || 0,
        qris: transaksi?.filter((t) => t.metode_pembayaran === 'qris').length || 0,
      };

      setReportData({ overview, revenueByDate, topMenu, ordersByStatus, paymentMethods, hourlyOrders });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981'];

  if (loading) return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Laporan & Analytics</h1>
            <p className="text-neutral-600 mt-1">Analisis performa dan insight bisnis restoran</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchReportData} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Refresh
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />Export
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Periode:</span>
            </div>

            <div className="relative" ref={startDatePickerRef}>
              <button
                onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[180px]"
              >
                <span className="flex-1 text-left text-neutral-900 dark:text-white">
                  {dateRange.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </button>

              {showStartDatePicker && (
                <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 min-w-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentStartMonth(new Date(currentStartMonth.getFullYear(), currentStartMonth.getMonth() - 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="font-bold text-neutral-900 dark:text-white">{months[currentStartMonth.getMonth()]} {currentStartMonth.getFullYear()}</span>
                    <button onClick={() => setCurrentStartMonth(new Date(currentStartMonth.getFullYear(), currentStartMonth.getMonth() + 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map(day => <div key={day} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-2">{day}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentStartMonth).map((date, i) => {
                      if (!date) return <div key={`e-${i}`} className="aspect-square" />;
                      const isSelected = date.toDateString() === dateRange.startDate.toDateString();
                      return (
                        <button key={i} onClick={() => handleDateClick(date, 'start')} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}>
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <span className="text-neutral-600 dark:text-neutral-400">sampai</span>

            <div className="relative" ref={endDatePickerRef}>
              <button
                onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[180px]"
              >
                <span className="flex-1 text-left text-neutral-900 dark:text-white">
                  {dateRange.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </button>

              {showEndDatePicker && (
                <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 min-w-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentEndMonth(new Date(currentEndMonth.getFullYear(), currentEndMonth.getMonth() - 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="font-bold text-neutral-900 dark:text-white">{months[currentEndMonth.getMonth()]} {currentEndMonth.getFullYear()}</span>
                    <button onClick={() => setCurrentEndMonth(new Date(currentEndMonth.getFullYear(), currentEndMonth.getMonth() + 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map(day => <div key={day} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-2">{day}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentEndMonth).map((date, i) => {
                      if (!date) return <div key={`e-${i}`} className="aspect-square" />;
                      const isSelected = date.toDateString() === dateRange.endDate.toDateString();
                      return (
                        <button key={i} onClick={() => handleDateClick(date, 'end')} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}>
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-blue-100 text-sm mb-1">Total Pesanan</p>
                <p className="text-3xl font-bold mb-2">{reportData.overview.totalOrders}</p>
                <div className={`flex items-center gap-1 text-sm ${reportData.overview.orderGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {reportData.overview.orderGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{Math.abs(reportData.overview.orderGrowth).toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-green-100 text-sm mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold mb-2">Rp {(reportData.overview.totalRevenue / 1000000).toFixed(1)}jt</p>
                <div className={`flex items-center gap-1 text-sm ${reportData.overview.revenueGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {reportData.overview.revenueGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{Math.abs(reportData.overview.revenueGrowth).toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-purple-100 text-sm mb-1">Total Transaksi</p>
                <p className="text-3xl font-bold mb-2">{reportData.overview.totalTransaksi}</p>
                <p className="text-sm text-purple-200">Transaksi selesai</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-amber-100 text-sm mb-1">Rata-rata Order</p>
                <p className="text-2xl font-bold mb-2">Rp {(reportData.overview.avgOrderValue / 1000).toFixed(0)}k</p>
                <p className="text-sm text-amber-200">Per transaksi</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Tren Pendapatan Harian</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.revenueByDate}>
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
          </Card>

          {/* Hourly Orders Chart */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Pola Pesanan per Jam</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.hourlyOrders}>
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
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Menu */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Menu Terlaris</h3>
            {reportData.topMenu.length === 0 ? (
              <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.topMenu.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold rounded-xl flex-shrink-0 text-lg shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-800 dark:text-white truncate">{item.masakan?.nama_masakan || 'Unknown'}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Terjual: {item.total} porsi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">Rp {(item.revenue / 1000).toFixed(0)}k</p>
                      <div className="flex items-center gap-1 text-amber-500 justify-end">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-medium">Top</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Payment Methods */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Metode Pembayaran</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-neutral-800 dark:text-white">Tunai</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{reportData.paymentMethods.tunai}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-neutral-800 dark:text-white">Debit</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{reportData.paymentMethods.debit}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-neutral-800 dark:text-white">QRIS</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{reportData.paymentMethods.qris}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}