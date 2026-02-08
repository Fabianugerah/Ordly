'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Banknote,
  CreditCard,
  Smartphone,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
// Import Components & Chart
import DateRangePicker from '@/components/ui/DateRangePicker';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function KasirLaporanPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  
  // Menggunakan Date Object untuk DateRangePicker
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  const [reportData, setReportData] = useState({
    summary: {
      totalTransaksi: 0,
      totalRevenue: 0,
      avgTransactionValue: 0,
      myTransactions: 0,
    },
    paymentMethods: {
      tunai: { count: 0, total: 0 },
      debit: { count: 0, total: 0 },
      qris: { count: 0, total: 0 },
    },
    dailyRevenue: [] as any[],
    topDays: [] as any[],
  });

  useEffect(() => {
    if (user && dateRange.startDate && dateRange.endDate) {
      fetchReportData();
    }
  }, [dateRange, user]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      if (!dateRange.startDate || !dateRange.endDate) return;

      const startDateStr = new Intl.DateTimeFormat('en-CA').format(dateRange.startDate);
      const endDateStr = new Intl.DateTimeFormat('en-CA').format(dateRange.endDate);

      // Fetch all transactions in period (Global Store Stats)
      const { data: allTransaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr)
        .order('created_at', { ascending: false });

      // Fetch my transactions (Kinerja Kasir Ini)
      const { data: myTransaksi } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id_user', user?.id_user)
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr);

      if (!allTransaksi) {
        setLoading(false);
        return;
      }

      // Calculate summary
      const totalTransaksi = allTransaksi.length;
      const totalRevenue = allTransaksi.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      );
      const avgTransactionValue = totalTransaksi > 0 ? totalRevenue / totalTransaksi : 0;
      const myTransactions = myTransaksi?.length || 0;

      // Payment methods breakdown
      const paymentMethods = {
        tunai: {
          count: allTransaksi.filter((t) => t.metode_pembayaran === 'tunai').length,
          total: allTransaksi.filter((t) => t.metode_pembayaran === 'tunai').reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0),
        },
        debit: {
          count: allTransaksi.filter((t) => t.metode_pembayaran === 'debit').length,
          total: allTransaksi.filter((t) => t.metode_pembayaran === 'debit').reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0),
        },
        qris: {
          count: allTransaksi.filter((t) => t.metode_pembayaran === 'qris').length,
          total: allTransaksi.filter((t) => t.metode_pembayaran === 'qris').reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0),
        },
      };

      // Daily revenue (For Chart)
      const revenueByDate: { [key: string]: number } = {};
      allTransaksi.forEach((t) => {
        if (!revenueByDate[t.tanggal]) {
          revenueByDate[t.tanggal] = 0;
        }
        revenueByDate[t.tanggal] += parseFloat(t.total_bayar.toString());
      });

      const dailyRevenue = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({
          date,
          revenue,
          formattedDate: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top revenue days
      const topDays = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({
          date,
          revenue,
          formattedDate: new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setReportData({
        summary: { totalTransaksi, totalRevenue, avgTransactionValue, myTransactions },
        paymentMethods,
        dailyRevenue,
        topDays,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('Fitur Export PDF akan segera tersedia!');
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['kasir']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  // --- STAT CARD COMPONENT (Inline) ---
  const StatCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
    <Card className={`relative overflow-hidden border-none ${colorClass} text-white`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-white/80 text-sm mb-1 font-medium">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
                {subValue && <p className="text-white/70 text-xs mt-2">{subValue}</p>}
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </Card>
  );

  return (
    <DashboardLayout allowedRoles={['kasir']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Laporan Kasir</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Ringkasan transaksi dan setoran harian</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Laporan
          </Button>
        </div>

        {/* Filter Section (DateRangePicker) */}
        <Card className="p-4 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
             <div className="w-full sm:w-auto">
                <DateRangePicker 
                    startDate={dateRange.startDate} 
                    endDate={dateRange.endDate} 
                    onChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
                />
             </div>
             <Button onClick={() => fetchReportData()} className="w-full sm:w-auto">
                Terapkan Filter
             </Button>
          </div>
        </Card>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Pendapatan" 
            value={`Rp ${(reportData.summary.totalRevenue / 1000000).toFixed(1)}jt`}
            subValue="Semua transaksi periode ini"
            icon={DollarSign}
            colorClass="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <StatCard 
            title="Total Transaksi" 
            value={reportData.summary.totalTransaksi}
            subValue="Transaksi berhasil"
            icon={Receipt}
            colorClass="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <StatCard 
            title="Transaksi Saya" 
            value={reportData.summary.myTransactions}
            subValue="Diproses oleh Anda"
            icon={UserCheck}
            colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatCard 
            title="Rata-rata Order" 
            value={`Rp ${(reportData.summary.avgTransactionValue / 1000).toFixed(0)}k`}
            subValue="Per struk belanja"
            icon={TrendingUp}
            colorClass="bg-gradient-to-br from-purple-500 to-violet-600"
          />
        </div>

        {/* Charts & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-4">Tren Pendapatan Harian</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportData.dailyRevenue}>
                            <defs>
                                <linearGradient id="colorRevenueKasir" x1="0" y1="0" x2="0" y2="1">
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
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorRevenueKasir)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Payment Methods List */}
            <Card>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">Metode Pembayaran</h3>
                <div className="space-y-4">
                    {/* Tunai */}
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                                <Banknote className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-800 dark:text-white">Tunai</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{reportData.paymentMethods.tunai.count} Trx</p>
                            </div>
                        </div>
                        <p className="font-bold text-green-600 dark:text-green-400">
                            Rp {(reportData.paymentMethods.tunai.total / 1000).toFixed(0)}k
                        </p>
                    </div>

                    {/* Debit */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-800 dark:text-white">Debit</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{reportData.paymentMethods.debit.count} Trx</p>
                            </div>
                        </div>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                            Rp {(reportData.paymentMethods.debit.total / 1000).toFixed(0)}k
                        </p>
                    </div>

                    {/* QRIS */}
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                                <Smartphone className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-800 dark:text-white">QRIS</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{reportData.paymentMethods.qris.count} Trx</p>
                            </div>
                        </div>
                        <p className="font-bold text-purple-600 dark:text-purple-400">
                            Rp {(reportData.paymentMethods.qris.total / 1000).toFixed(0)}k
                        </p>
                    </div>
                </div>
            </Card>
        </div>

        {/* Top Days Table */}
        <Card title="Hari Tersibuk">
            {reportData.topDays.length === 0 ? (
                <p className="text-center text-neutral-500 py-8">Belum ada data transaksi</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Peringkat</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Tanggal</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">Total Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {reportData.topDays.map((day, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                    <td className="px-4 py-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-amber-500' : 'bg-neutral-400'}`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-neutral-800 dark:text-white">
                                        {day.formattedDate}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-green-600 text-right tabular-nums">
                                        Rp {day.revenue.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>

      </div>
    </DashboardLayout>
  );
}