// src/app/dashboard/waiter/laporan/page.tsx (UPDATED)
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  Calendar, 
  Package, 
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  Truck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function WaiterLaporanPage() {
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
      totalOrdersDiantar: 0,
      orderSelesai: 0,
      avgDeliveryPerDay: 0,
      completionRate: 0,
    },
    ordersByStatus: {
      pending: 0,
      proses: 0,
      selesai: 0,
      dibatalkan: 0,
    },
    dailyDeliveries: [] as any[],
    busiestTables: [] as any[],
    peakHours: [] as any[],
  });

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [dateRange, user]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch all orders dalam periode (karena waiter melayani semua orders)
      const { data: orders } = await supabase
        .from('order')
        .select(`
          *,
          detail_order(*, masakan(*))
        `)
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate)
        .order('created_at', { ascending: false });

      if (!orders) {
        setLoading(false);
        return;
      }

      // Calculate summary
      const totalOrdersDiantar = orders.length;
      const orderSelesai = orders.filter((o) => o.status_order === 'selesai').length;
      const completionRate = totalOrdersDiantar > 0 ? (orderSelesai / totalOrdersDiantar) * 100 : 0;
      
      // Calculate days in range
      const daysDiff = Math.ceil(
        (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const avgDeliveryPerDay = daysDiff > 0 ? totalOrdersDiantar / daysDiff : 0;

      // Orders by status
      const ordersByStatus = {
        pending: orders.filter((o) => o.status_order === 'pending').length,
        proses: orders.filter((o) => o.status_order === 'proses').length,
        selesai: orders.filter((o) => o.status_order === 'selesai').length,
        dibatalkan: orders.filter((o) => o.status_order === 'dibatalkan').length,
      };

      // Daily deliveries
      const ordersByDate: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (!ordersByDate[order.tanggal]) {
          ordersByDate[order.tanggal] = 0;
        }
        ordersByDate[order.tanggal]++;
      });

      const dailyDeliveries = Object.entries(ordersByDate)
        .map(([date, count]) => ({
          date,
          count,
          formattedDate: new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);

      // Busiest tables (meja paling sering dilayani)
      const tableCount: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (!tableCount[order.no_meja]) {
          tableCount[order.no_meja] = 0;
        }
        tableCount[order.no_meja]++;
      });

      const busiestTables = Object.entries(tableCount)
        .map(([table, count]) => ({ table, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Peak hours (jam tersibuk)
      const hourCount: { [key: number]: number } = {};
      orders.forEach((order) => {
        const hour = new Date(order.created_at).getHours();
        if (!hourCount[hour]) {
          hourCount[hour] = 0;
        }
        hourCount[hour]++;
      });

      const peakHours = Object.entries(hourCount)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
          timeRange: `${hour.padStart(2, '0')}:00 - ${hour.padStart(2, '0')}:59`
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setReportData({
        summary: {
          totalOrdersDiantar,
          orderSelesai,
          avgDeliveryPerDay,
          completionRate,
        },
        ordersByStatus,
        dailyDeliveries,
        busiestTables,
        peakHours,
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
      <DashboardLayout allowedRoles={['waiter']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['waiter']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Laporan Saya</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Ringkasan performa delivery pesanan</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Date Range Filter */}
        <Card>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Periode Laporan
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="flex items-center text-gray-600 dark:text-gray-400">s/d</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <Button onClick={fetchReportData}>Generate Laporan</Button>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Pesanan</p>
            <p className="text-3xl font-bold">{reportData.summary.totalOrdersDiantar}</p>
            <p className="text-blue-100 text-xs mt-2">Pesanan dilayani</p>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-green-100 text-sm mb-1">Selesai Diantar</p>
            <p className="text-3xl font-bold">{reportData.summary.orderSelesai}</p>
            <p className="text-green-100 text-xs mt-2">Delivery sukses</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-purple-100 text-sm mb-1">Rata-rata Per Hari</p>
            <p className="text-3xl font-bold">{reportData.summary.avgDeliveryPerDay.toFixed(1)}</p>
            <p className="text-purple-100 text-xs mt-2">Pesanan per hari</p>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-8 h-8" />
            </div>
            <p className="text-amber-100 text-sm mb-1">Tingkat Penyelesaian</p>
            <p className="text-3xl font-bold">{reportData.summary.completionRate.toFixed(1)}%</p>
            <p className="text-amber-100 text-xs mt-2">Completion rate</p>
          </Card>
        </div>

        {/* Charts & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Deliveries Trend */}
          <Card title="Tren Delivery Harian (7 Hari Terakhir)">
            {reportData.dailyDeliveries.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.dailyDeliveries.map((data, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-20">
                      {data.formattedDate}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 h-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.min(
                            (data.count / Math.max(...reportData.dailyDeliveries.map((d) => d.count))) *
                              100,
                            100
                          )}%`,
                        }}
                      >
                        <span className="text-xs font-bold text-white">
                          {data.count} order
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Order Status Distribution */}
          <Card title="Status Pesanan">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-gray-800 dark:text-white">Pending</span>
                </div>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {reportData.ordersByStatus.pending}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-800 dark:text-white">Proses</span>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.ordersByStatus.proses}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-800 dark:text-white">Selesai</span>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {reportData.ordersByStatus.selesai}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❌</span>
                  <span className="font-medium text-gray-800 dark:text-white">Dibatalkan</span>
                </div>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {reportData.ordersByStatus.dibatalkan}
                </span>
              </div>
            </div>
          </Card>

          {/* Busiest Tables */}
          <Card title="Meja Paling Sering Dilayani">
            {reportData.busiestTables.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.busiestTables.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold rounded-lg flex items-center justify-center">
                        {item.table}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white">Meja {item.table}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{item.count}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">pesanan</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Peak Hours */}
          <Card title="Jam Tersibuk">
            {reportData.peakHours.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.peakHours.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{item.timeRange}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Waktu sibuk</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{item.count}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">pesanan</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Performance Summary */}
        <Card title="Ringkasan Performa">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                📊 Statistik Delivery
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total pesanan dilayani:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {reportData.summary.totalOrdersDiantar}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pesanan selesai diantar:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {reportData.summary.orderSelesai}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rata-rata per hari:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {reportData.summary.avgDeliveryPerDay.toFixed(1)} order
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tingkat penyelesaian:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {reportData.summary.completionRate.toFixed(1)}%
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                🎯 Area Layanan
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Meja tersibuk:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Meja {reportData.busiestTables[0]?.table || '-'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Jam tersibuk:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {reportData.peakHours[0]?.timeRange || '-'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pesanan pending:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {reportData.ordersByStatus.pending}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pesanan proses:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {reportData.ordersByStatus.proses}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">💡 Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.summary.completionRate >= 90 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    🎉 <strong>Excellent!</strong> Tingkat penyelesaian delivery Anda sangat baik (
                    {reportData.summary.completionRate.toFixed(1)}%)
                  </p>
                </div>
              )}
              {reportData.ordersByStatus.proses > 5 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    ⚠️ Ada {reportData.ordersByStatus.proses} pesanan yang sedang diproses
                  </p>
                </div>
              )}
              {reportData.summary.totalOrdersDiantar > 50 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💪 <strong>Great job!</strong> Anda telah melayani{' '}
                    {reportData.summary.totalOrdersDiantar} pesanan
                  </p>
                </div>
              )}
              {reportData.summary.avgDeliveryPerDay > 10 && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    ⭐ Produktivitas tinggi dengan rata-rata{' '}
                    {reportData.summary.avgDeliveryPerDay.toFixed(1)} delivery per hari
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}