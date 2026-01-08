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
  Smartphone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function KasirLaporanPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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
    hourlyDistribution: [] as any[],
    topDays: [] as any[],
  });

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [dateRange, user]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch all transactions in period
      const { data: allTransaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate)
        .order('created_at', { ascending: false });

      // Fetch my transactions (by this kasir)
      const { data: myTransaksi } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id_user', user?.id_user)
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate);

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
          total: allTransaksi
            .filter((t) => t.metode_pembayaran === 'tunai')
            .reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0),
        },
        debit: {
          count: allTransaksi.filter((t) => t.metode_pembayaran === 'debit').length,
          total: allTransaksi
            .filter((t) => t.metode_pembayaran === 'debit')
            .reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0),
        },
        qris: {
          count: allTransaksi.filter((t) => t.metode_pembayaran === 'qris').length,
          total: allTransaksi
            .filter((t) => t.metode_pembayaran === 'qris')
            .reduce((sum, t) => sum + parseFloat(t.total_bayar.toString()), 0),
        },
      };

      // Daily revenue
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
          formattedDate: new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Last 7 days

      // Top revenue days
      const topDays = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({
          date,
          revenue,
          formattedDate: new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setReportData({
        summary: {
          totalTransaksi,
          totalRevenue,
          avgTransactionValue,
          myTransactions,
        },
        paymentMethods,
        dailyRevenue,
        hourlyDistribution: [],
        topDays,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('Export feature - Coming soon!');
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

  return (
    <DashboardLayout allowedRoles={['kasir']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Laporan Kasir</h1>
            <p className="text-gray-600 mt-1">Ringkasan transaksi dan pembayaran</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Date Range */}
        <Card>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Periode Laporan
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="flex items-center">s/d</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <Button onClick={fetchReportData}>Generate Laporan</Button>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
            </div>
            <p className="text-green-100 text-sm mb-1">Total Pendapatan</p>
            <p className="text-3xl font-bold">
              Rp {(reportData.summary.totalRevenue / 1000000).toFixed(1)}jt
            </p>
            <p className="text-green-100 text-xs mt-2">Semua transaksi</p>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <Receipt className="w-8 h-8" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Transaksi</p>
            <p className="text-3xl font-bold">{reportData.summary.totalTransaksi}</p>
            <p className="text-blue-100 text-xs mt-2">Transaksi berhasil</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-purple-100 text-sm mb-1">Rata-rata Transaksi</p>
            <p className="text-2xl font-bold">
              Rp {(reportData.summary.avgTransactionValue / 1000).toFixed(0)}k
            </p>
            <p className="text-purple-100 text-xs mt-2">Per transaksi</p>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <Receipt className="w-8 h-8" />
            </div>
            <p className="text-amber-100 text-sm mb-1">Transaksi Saya</p>
            <p className="text-3xl font-bold">{reportData.summary.myTransactions}</p>
            <p className="text-amber-100 text-xs mt-2">Yang saya proses</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue */}
          <Card title="Pendapatan Harian (7 Hari Terakhir)">
            {reportData.dailyRevenue.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.dailyRevenue.map((data, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-20">
                      {data.formattedDate}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.min(
                            (data.revenue /
                              Math.max(...reportData.dailyRevenue.map((d) => d.revenue))) *
                              100,
                            100
                          )}%`,
                        }}
                      >
                        <span className="text-xs font-bold text-white">
                          {data.revenue > 0 && `Rp ${(data.revenue / 1000).toFixed(0)}k`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Payment Methods */}
          <Card title="Metode Pembayaran">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Tunai</p>
                      <p className="text-sm text-gray-600">
                        {reportData.paymentMethods.tunai.count} transaksi
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      Rp {(reportData.paymentMethods.tunai.total / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-gray-600">
                      {reportData.summary.totalRevenue > 0
                        ? (
                            (reportData.paymentMethods.tunai.total /
                              reportData.summary.totalRevenue) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        reportData.summary.totalRevenue > 0
                          ? (reportData.paymentMethods.tunai.total /
                              reportData.summary.totalRevenue) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Debit</p>
                      <p className="text-sm text-gray-600">
                        {reportData.paymentMethods.debit.count} transaksi
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">
                      Rp {(reportData.paymentMethods.debit.total / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-gray-600">
                      {reportData.summary.totalRevenue > 0
                        ? (
                            (reportData.paymentMethods.debit.total /
                              reportData.summary.totalRevenue) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        reportData.summary.totalRevenue > 0
                          ? (reportData.paymentMethods.debit.total /
                              reportData.summary.totalRevenue) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">QRIS</p>
                      <p className="text-sm text-gray-600">
                        {reportData.paymentMethods.qris.count} transaksi
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">
                      Rp {(reportData.paymentMethods.qris.total / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-gray-600">
                      {reportData.summary.totalRevenue > 0
                        ? (
                            (reportData.paymentMethods.qris.total /
                              reportData.summary.totalRevenue) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${
                        reportData.summary.totalRevenue > 0
                          ? (reportData.paymentMethods.qris.total /
                              reportData.summary.totalRevenue) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Days */}
        <Card title="Hari dengan Pendapatan Tertinggi">
          {reportData.topDays.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Tidak ada data</p>
          ) : (
            <div className="space-y-3">
              {reportData.topDays.map((day, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{day.formattedDate}</p>
                    <p className="text-sm text-gray-600">{day.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      Rp {(day.revenue / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Summary */}
        <Card title="Ringkasan Performa">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">📊 Statistik Transaksi</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total transaksi:</span>
                  <span className="font-semibold">{reportData.summary.totalTransaksi}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Transaksi saya:</span>
                  <span className="font-semibold text-blue-600">
                    {reportData.summary.myTransactions}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Total pendapatan:</span>
                  <span className="font-semibold">
                    Rp {reportData.summary.totalRevenue.toLocaleString('id-ID')}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Rata-rata transaksi:</span>
                  <span className="font-semibold">
                    Rp {reportData.summary.avgTransactionValue.toLocaleString('id-ID')}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">💳 Metode Pembayaran Favorit</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Tunai:</span>
                  <span className="font-semibold">
                    {reportData.paymentMethods.tunai.count} transaksi
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Debit:</span>
                  <span className="font-semibold">
                    {reportData.paymentMethods.debit.count} transaksi
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">QRIS:</span>
                  <span className="font-semibold">
                    {reportData.paymentMethods.qris.count} transaksi
                  </span>
                </li>
                <li className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600 font-medium">Paling populer:</span>
                  <span className="font-semibold text-primary">
                    {reportData.paymentMethods.tunai.count >=
                      reportData.paymentMethods.debit.count &&
                    reportData.paymentMethods.tunai.count >= reportData.paymentMethods.qris.count
                      ? 'Tunai'
                      : reportData.paymentMethods.debit.count >=
                        reportData.paymentMethods.qris.count
                      ? 'Debit'
                      : 'QRIS'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}