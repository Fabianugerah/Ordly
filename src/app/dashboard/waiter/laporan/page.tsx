'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  Download
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
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      completionRate: 0,
    },
    ordersByStatus: {
      pending: 0,
      proses: 0,
      selesai: 0,
      dibatalkan: 0,
    },
    dailyOrders: [] as any[],
    topMenuOrdered: [] as any[],
    ordersByTable: [] as any[],
  });

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [dateRange, user]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch orders by this waiter
      const { data: orders } = await supabase
        .from('order')
        .select(`
          *,
          detail_order(*, masakan(*))
        `)
        .eq('id_user', user?.id_user)
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate)
        .order('created_at', { ascending: false });

      if (!orders) {
        setLoading(false);
        return;
      }

      // Calculate summary
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, o) => sum + parseFloat(o.total_harga.toString()),
        0
      );
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completedOrders = orders.filter((o) => o.status_order === 'selesai').length;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Orders by status
      const ordersByStatus = {
        pending: orders.filter((o) => o.status_order === 'pending').length,
        proses: orders.filter((o) => o.status_order === 'proses').length,
        selesai: orders.filter((o) => o.status_order === 'selesai').length,
        dibatalkan: orders.filter((o) => o.status_order === 'dibatalkan').length,
      };

      // Daily orders
      const ordersByDate: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (!ordersByDate[order.tanggal]) {
          ordersByDate[order.tanggal] = 0;
        }
        ordersByDate[order.tanggal]++;
      });

      const dailyOrders = Object.entries(ordersByDate)
        .map(([date, count]) => ({
          date,
          count,
          formattedDate: new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Last 7 days

      // Top menu ordered
      const menuCount: { [key: number]: { count: number; masakan: any } } = {};
      orders.forEach((order) => {
        order.detail_order?.forEach((detail: any) => {
          if (detail.id_masakan) {
            if (!menuCount[detail.id_masakan]) {
              menuCount[detail.id_masakan] = { count: 0, masakan: detail.masakan };
            }
            menuCount[detail.id_masakan].count += detail.jumlah;
          }
        });
      });

      const topMenuOrdered = Object.values(menuCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Orders by table (most frequent tables)
      const tableCount: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (!tableCount[order.no_meja]) {
          tableCount[order.no_meja] = 0;
        }
        tableCount[order.no_meja]++;
      });

      const ordersByTable = Object.entries(tableCount)
        .map(([table, count]) => ({ table, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setReportData({
        summary: {
          totalOrders,
          totalRevenue,
          avgOrderValue,
          completionRate,
        },
        ordersByStatus,
        dailyOrders,
        topMenuOrdered,
        ordersByTable,
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
            <h1 className="text-3xl font-bold text-gray-800">Laporan Saya</h1>
            <p className="text-gray-600 mt-1">Ringkasan performa dan pesanan Anda</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="flex items-center text-gray-600">s/d</span>
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
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Pesanan</p>
            <p className="text-3xl font-bold">{reportData.summary.totalOrders}</p>
            <p className="text-blue-100 text-xs mt-2">Pesanan yang saya tangani</p>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
            </div>
            <p className="text-green-100 text-sm mb-1">Total Penjualan</p>
            <p className="text-2xl font-bold">
              Rp {(reportData.summary.totalRevenue / 1000000).toFixed(1)}jt
            </p>
            <p className="text-green-100 text-xs mt-2">Nilai pesanan total</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-purple-100 text-sm mb-1">Rata-rata Order</p>
            <p className="text-2xl font-bold">
              Rp {(reportData.summary.avgOrderValue / 1000).toFixed(0)}k
            </p>
            <p className="text-purple-100 text-xs mt-2">Per transaksi</p>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-amber-100 text-sm mb-1">Completion Rate</p>
            <p className="text-3xl font-bold">{reportData.summary.completionRate.toFixed(1)}%</p>
            <p className="text-amber-100 text-xs mt-2">Pesanan selesai</p>
          </Card>
        </div>

        {/* Charts & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Orders Trend */}
          <Card title="Tren Pesanan Harian (7 Hari Terakhir)">
            {reportData.dailyOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.dailyOrders.map((data, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-20">
                      {data.formattedDate}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.min(
                            (data.count / Math.max(...reportData.dailyOrders.map((d) => d.count))) *
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
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-gray-800">Pending</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {reportData.ordersByStatus.pending}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-800">Proses</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {reportData.ordersByStatus.proses}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-800">Selesai</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {reportData.ordersByStatus.selesai}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❌</span>
                  <span className="font-medium text-gray-800">Dibatalkan</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {reportData.ordersByStatus.dibatalkan}
                </span>
              </div>
            </div>
          </Card>

          {/* Top Menu Ordered */}
          <Card title="Menu Paling Sering Dipesan">
            {reportData.topMenuOrdered.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.topMenuOrdered.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-white font-bold rounded-full">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {item.masakan?.nama_masakan || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.masakan?.kategori || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{item.count}</p>
                      <p className="text-xs text-gray-600">porsi</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Orders by Table */}
          <Card title="Meja Paling Aktif">
            {reportData.ordersByTable.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.ordersByTable.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold rounded-lg flex items-center justify-center">
                        {item.table}
                      </div>
                      <span className="font-medium text-gray-800">Meja {item.table}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                      <p className="text-xs text-gray-600">pesanan</p>
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
              <h3 className="font-semibold text-lg mb-3">📊 Statistik Pesanan</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total pesanan ditangani:</span>
                  <span className="font-semibold">{reportData.summary.totalOrders}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Pesanan selesai:</span>
                  <span className="font-semibold text-green-600">
                    {reportData.ordersByStatus.selesai}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Pesanan pending:</span>
                  <span className="font-semibold text-amber-600">
                    {reportData.ordersByStatus.pending}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Tingkat penyelesaian:</span>
                  <span className="font-semibold text-blue-600">
                    {reportData.summary.completionRate.toFixed(1)}%
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">💰 Nilai Penjualan</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total nilai pesanan:</span>
                  <span className="font-semibold">
                    Rp {reportData.summary.totalRevenue.toLocaleString('id-ID')}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Rata-rata per order:</span>
                  <span className="font-semibold">
                    Rp {reportData.summary.avgOrderValue.toLocaleString('id-ID')}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Menu terfavorit:</span>
                  <span className="font-semibold">
                    {reportData.topMenuOrdered[0]?.masakan?.nama_masakan || '-'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Meja tersibuk:</span>
                  <span className="font-semibold">
                    Meja {reportData.ordersByTable[0]?.table || '-'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-lg mb-3">💡 Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.summary.completionRate >= 90 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    🎉 <strong>Excellent!</strong> Tingkat penyelesaian Anda sangat baik (
                    {reportData.summary.completionRate.toFixed(1)}%)
                  </p>
                </div>
              )}
              {reportData.ordersByStatus.pending > 5 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    ⚠️ Ada {reportData.ordersByStatus.pending} pesanan pending yang perlu
                    ditindaklanjuti
                  </p>
                </div>
              )}
              {reportData.summary.totalOrders > 50 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💪 <strong>Great job!</strong> Anda telah menangani{' '}
                    {reportData.summary.totalOrders} pesanan dalam periode ini
                  </p>
                </div>
              )}
              {reportData.summary.avgOrderValue > 100000 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    ⭐ Rata-rata nilai order Anda tinggi (Rp{' '}
                    {(reportData.summary.avgOrderValue / 1000).toFixed(0)}k)
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