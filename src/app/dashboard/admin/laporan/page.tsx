'use client';

import { useEffect, useState } from 'react';
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
  Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLaporanPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      totalTransaksi: 0,
      avgOrderValue: 0,
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
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch orders
      const { data: orders } = await supabase
        .from('order')
        .select('*')
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate);

      // Fetch transactions
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate);

      // Fetch detail orders with menu
      const { data: detailOrders } = await supabase
        .from('detail_order')
        .select('*, masakan(*), order!inner(tanggal)')
        .gte('order.tanggal', dateRange.startDate)
        .lte('order.tanggal', dateRange.endDate);

      // Calculate overview
      const totalRevenue = transaksi?.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      ) || 0;

      const overview = {
        totalOrders: orders?.length || 0,
        totalRevenue: totalRevenue,
        totalTransaksi: transaksi?.length || 0,
        avgOrderValue: orders?.length ? totalRevenue / orders.length : 0,
      };

      // Calculate revenue by date
      const revenueMap: { [key: string]: number } = {};
      transaksi?.forEach((t) => {
        const date = t.tanggal;
        if (!revenueMap[date]) revenueMap[date] = 0;
        revenueMap[date] += parseFloat(t.total_bayar.toString());
      });

      const revenueByDate = Object.entries(revenueMap)
        .map(([date, revenue]) => ({
          date,
          revenue,
          formattedDate: new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate top menu
      const menuSales: {
        [key: number]: { total: number; revenue: number; masakan: any };
      } = {};

      detailOrders?.forEach((detail) => {
        if (detail.id_masakan) {
          if (!menuSales[detail.id_masakan]) {
            menuSales[detail.id_masakan] = {
              total: 0,
              revenue: 0,
              masakan: detail.masakan,
            };
          }
          menuSales[detail.id_masakan].total += detail.jumlah;
          menuSales[detail.id_masakan].revenue += parseFloat(
            detail.subtotal.toString()
          );
        }
      });

      const topMenu = Object.values(menuSales)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

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
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert('Export PDF feature - Coming soon!');
  };

  const handleExportExcel = () => {
    alert('Export Excel feature - Coming soon!');
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['administrator']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Laporan Restoran</h1>
            <p className="text-gray-600 mt-1">Analisis performa bisnis restoran</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
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
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <Button onClick={fetchReportData} className="whitespace-nowrap">
              Generate Laporan
            </Button>
          </div>
        </Card>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Pesanan</p>
                <p className="text-3xl font-bold">{reportData.overview.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold">
                  Rp {(reportData.overview.totalRevenue / 1000000).toFixed(1)}jt
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Transaksi</p>
                <p className="text-3xl font-bold">{reportData.overview.totalTransaksi}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm mb-1">Rata-rata Order</p>
                <p className="text-2xl font-bold">
                  Rp {(reportData.overview.avgOrderValue / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card title="Tren Pendapatan">
            <div className="space-y-3">
              {reportData.revenueByDate.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Tidak ada data untuk periode ini
                </p>
              ) : (
                reportData.revenueByDate.map((data, idx) => (
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
                              Math.max(...reportData.revenueByDate.map((d) => d.revenue))) *
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
                ))
              )}
            </div>
          </Card>

          {/* Top Menu */}
          <Card title="Menu Terlaris">
            {reportData.topMenu.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.topMenu.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-white font-bold rounded-full flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {item.masakan?.nama_masakan || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Terjual: {item.total} porsi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        Rp {(item.revenue / 1000).toFixed(0)}k
                      </p>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-medium">Top</span>
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
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Pending</span>
                </div>
                <span className="text-xl font-bold text-amber-600">
                  {reportData.ordersByStatus.pending}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Proses</span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {reportData.ordersByStatus.proses}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Selesai</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {reportData.ordersByStatus.selesai}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Dibatalkan</span>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {reportData.ordersByStatus.dibatalkan}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card title="Metode Pembayaran">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center">
                    💵
                  </div>
                  <span className="font-medium text-gray-800">Tunai</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {reportData.paymentMethods.tunai}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                    💳
                  </div>
                  <span className="font-medium text-gray-800">Debit</span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {reportData.paymentMethods.debit}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center">
                    📱
                  </div>
                  <span className="font-medium text-gray-800">QRIS</span>
                </div>
                <span className="text-xl font-bold text-purple-600">
                  {reportData.paymentMethods.qris}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}