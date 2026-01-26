'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
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
  ArrowDown,
  Search,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminLaporanPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  
  // State baru untuk Search
  const [search, setSearch] = useState('');

  const datePickerRef = useRef<HTMLDivElement>(null);

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
    transactionList: [] as any[], // Data untuk tabel riwayat
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // load pertama kali (PAKAI LOADING)
  useEffect(() => {
    fetchReportData(true);
  }, []);

  // ganti tanggal (TANPA LOADING)
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchReportData(false);
    }
  }, [dateRange]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);


  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handleDateClick = (date: Date) => {
    // klik pertama / reset
    if (!dateRange.startDate || dateRange.endDate) {
      setDateRange({ startDate: date, endDate: null as any });
      setHoverDate(null);
      return;
    }

    // klik kedua
    if (date > dateRange.startDate) {
      setDateRange({ ...dateRange, endDate: date });
      setShowDatePicker(false);
    } else {
      setDateRange({ startDate: date, endDate: null as any });
    }
  };

  const isInRange = (date: Date) => {
    if (!dateRange.startDate) return false;

    // hover preview
    if (!dateRange.endDate && hoverDate) {
      const start = dateRange.startDate < hoverDate ? dateRange.startDate : hoverDate;
      const end = dateRange.startDate < hoverDate ? hoverDate : dateRange.startDate;
      return date > start && date < end;
    }

    if (dateRange.endDate) {
      return date > dateRange.startDate && date < dateRange.endDate;
    }

    return false;
  };


  const fetchReportData = async (showLoader = false) => {
    try {
      showLoader ? setInitialLoading(true) : setIsFetching(true);

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

      // Fetch transactions (UPDATED: Include Relations for Table)
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*, order:id_order(no_meja), users:id_user(nama_user)')
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr)
        .order('created_at', { ascending: false });

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

      setReportData({ 
        overview, 
        revenueByDate, 
        topMenu, 
        ordersByStatus, 
        paymentMethods, 
        hourlyOrders,
        transactionList: transaksi || [] 
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      showLoader ? setInitialLoading(false) : setIsFetching(false);
    }
  };

  // Filter Data Transaksi berdasarkan Search
  const filteredTransactions = reportData.transactionList.filter(item => 
    item.id_transaksi.toString().includes(search) || 
    item.order?.no_meja?.toLowerCase().includes(search.toLowerCase()) ||
    item.users?.nama_user?.toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981'];

  if (initialLoading) return (
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
            <Button onClick={() => fetchReportData(false)} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Refresh
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />Export
            </Button>
          </div>
        </div>

        {/* Filter Section (Date & Search) */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Periode:</span>
              </div>

              {/* Date Picker */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[280px] text-sm"
                >
                  <span className="text-neutral-900 dark:text-white font-medium">
                    {dateRange.startDate && dateRange.endDate
                      ? `${dateRange.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${dateRange.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Pilih Periode Laporan'}
                  </span>
                  {isFetching && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  )}
                </button>

                {showDatePicker && (
                  /* Glassmorphism Date Picker */
                  <div className="absolute left-0 z-50 mt-2 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <div className="flex flex-col md:flex-row gap-6">
                      {[0, 1].map((offset) => {
                        const monthDate = new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + offset
                        );

                        return (
                          <div key={offset} className="w-[280px]">
                            <div className="flex items-center justify-between mb-4 px-1">
                              {offset === 0 ? (
                                <button
                                  onClick={() =>
                                    setCurrentMonth(
                                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                                    )
                                  }
                                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              ) : <div className="w-7" />}

                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {months[monthDate.getMonth()]} {monthDate.getFullYear()}
                              </span>

                              {offset === 1 ? (
                                <button
                                  onClick={() =>
                                    setCurrentMonth(
                                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                                    )
                                  }
                                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              ) : <div className="w-7" />}
                            </div>

                            <div className="grid grid-cols-7 text-xs text-center mb-2">
                              {daysOfWeek.map((d) => (
                                <div key={d} className="text-neutral-400 font-medium py-1">{d}</div>
                              ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                              {getDaysInMonth(monthDate).map((date, i) => {
                                if (!date) return <div key={i} />;
                                const isStart = dateRange.startDate && date.toDateString() === dateRange.startDate.toDateString();
                                const isEnd = dateRange.endDate && date.toDateString() === dateRange.endDate.toDateString();
                                const inRange = isInRange(date);

                                return (
                                  <button
                                    key={i}
                                    onClick={() => handleDateClick(date)}
                                    onMouseEnter={() => { if (dateRange.startDate && !dateRange.endDate) setHoverDate(date); }}
                                    onMouseLeave={() => setHoverDate(null)}
                                    className={`
                                      h-8 text-xs font-medium flex items-center justify-center transition-all relative
                                      ${isStart ? 'bg-orange-500 text-white rounded-l-md z-10' : ''}
                                      ${isEnd ? 'bg-orange-500 text-white rounded-r-md z-10' : ''}
                                      ${inRange ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : ''}
                                      ${!isStart && !isEnd && !inRange ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-md' : ''}
                                    `}
                                  >
                                    {date.getDate()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- Search Input Baru --- */}
            <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                    type="text" 
                    placeholder="Cari ID transaksi, meja, atau kasir..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm dark:text-white transition-all"
                />
            </div>

          </div>
        </Card>


        {/* Overview Statistics (Sama) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Pesanan"
            value={reportData.overview.totalOrders.toLocaleString()}
            growth={reportData.overview.orderGrowth}
            icon={<ShoppingCart className="w-5 h-5" />}
          />
          <StatCard
            title="Total Pendapatan"
            value={`Rp ${(reportData.overview.totalRevenue / 1_000_000).toFixed(1)} jt`}
            growth={reportData.overview.revenueGrowth}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            title="Total Transaksi"
            value={reportData.overview.totalTransaksi.toLocaleString()}
            growth={reportData.overview.orderGrowth}
            icon={<FileText className="w-5 h-5" />}
          />
          <StatCard
            title="Rata-rata Order"
            value={`Rp ${(reportData.overview.avgOrderValue / 1000).toFixed(0)}k`}
            growth={reportData.overview.revenueGrowth}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Charts (Sama) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Bottom Section (UPDATED STYLE) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Menu (List Style) */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6 text-neutral-800 dark:text-white">Menu Terlaris</h3>
            {reportData.topMenu.length === 0 ? (
              <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">Tidak ada data</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {reportData.topMenu.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-white shadow-sm flex-shrink-0 ${idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-neutral-700' : idx === 2 ? 'bg-neutral-600' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">{item.masakan?.nama_masakan || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            {item.masakan?.kategori || 'Menu'}
                         </span>
                         <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.total} terjual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900 dark:text-white">Rp {(item.revenue / 1000).toFixed(0)}k</p>
                      {idx === 0 && (
                          <div className="flex items-center justify-end gap-1 text-orange-500 mt-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-bold uppercase">Top 1</span>
                          </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Payment Methods (List Style) */}
          <Card>
            <h3 className="text-lg font-semibold mb-6 text-neutral-800 dark:text-white">Metode Pembayaran</h3>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              
              {/* Tunai */}
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="font-medium text-neutral-900 dark:text-white">Tunai</p>
                     <p className="text-xs text-neutral-500 dark:text-neutral-400">Cash Payment</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">{reportData.paymentMethods.tunai}</span>
              </div>

              {/* Debit */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="font-medium text-neutral-900 dark:text-white">Debit</p>
                     <p className="text-xs text-neutral-500 dark:text-neutral-400">Card Payment</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">{reportData.paymentMethods.debit}</span>
              </div>

              {/* QRIS */}
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="font-medium text-neutral-900 dark:text-white">QRIS</p>
                     <p className="text-xs text-neutral-500 dark:text-neutral-400">Digital Payment</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">{reportData.paymentMethods.qris}</span>
              </div>

            </div>
          </Card>
        </div>

        {/* --- TABEL RIWAYAT TRANSAKSI (New) --- */}
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">Riwayat Transaksi</h3>
                <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                    {filteredTransactions.length} transaksi
                </span>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Meja</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Kasir</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Metode</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                    Tidak ada transaksi ditemukan
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((t) => (
                                <tr key={t.id_transaksi} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">#{t.id_transaksi}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                                        Meja {t.order?.no_meja || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs text-neutral-600 dark:text-neutral-400">
                                                <Users className="w-3 h-3" />
                                            </div>
                                            {t.users?.nama_user || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${t.metode_pembayaran === 'tunai' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                              t.metode_pembayaran === 'debit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                            }`}>
                                            {t.metode_pembayaran}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white text-right tabular-nums">
                                        Rp {parseFloat(t.total_bayar).toLocaleString('id-ID')}
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