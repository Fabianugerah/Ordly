'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Download, Calendar, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OwnerLaporanPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      avgOrderValue: 0,
    },
    topMenu: [] as any[],
    revenueByCategory: [] as any[],
    monthlyComparison: [] as any[],
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
        .lte('tanggal', dateRange.endDate)
        .eq('status_order', 'selesai');

      // Fetch transactions
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', dateRange.startDate)
        .lte('tanggal', dateRange.endDate);

      // Fetch detail orders
      const { data: detailOrders } = await supabase
        .from('detail_order')
        .select('*, masakan(*), order!inner(tanggal, status_order)')
        .gte('order.tanggal', dateRange.startDate)
        .lte('order.tanggal', dateRange.endDate)
        .eq('order.status_order', 'selesai');

      // Calculate summary
      const totalRevenue = transaksi?.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      ) || 0;
      const totalOrders = orders?.length || 0;
      const totalCustomers = new Set(orders?.map((o) => o.id_user)).size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate top menu
      const menuSales: { [key: number]: { total: number; revenue: number; masakan: any } } = {};
      detailOrders?.forEach((detail) => {
        if (detail.id_masakan && detail.masakan) {
          if (!menuSales[detail.id_masakan]) {
            menuSales[detail.id_masakan] = {
              total: 0,
              revenue: 0,
              masakan: detail.masakan,
            };
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
        summary: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          avgOrderValue,
        },
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

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['owner']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['owner']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Laporan Bisnis</h1>
            <p className="text-gray-600 mt-1">Laporan lengkap performa restoran</p>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>

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

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm mb-1">Total Pendapatan</p>
            <p className="text-3xl font-bold">
              Rp {(reportData.summary.totalRevenue / 1000000).toFixed(1)}jt
            </p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-sm mb-1">Total Pesanan</p>
            <p className="text-3xl font-bold">{reportData.summary.totalOrders}</p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-purple-100 text-sm mb-1">Total Pelanggan</p>
            <p className="text-3xl font-bold">{reportData.summary.totalCustomers}</p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <p className="text-amber-100 text-sm mb-1">Rata-rata Order</p>
            <p className="text-2xl font-bold">
              Rp {(reportData.summary.avgOrderValue / 1000).toFixed(0)}k
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Menu */}
          <Card title="Top 10 Menu Terlaris">
            {reportData.topMenu.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-2">
                {reportData.topMenu.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {item.masakan?.nama_masakan}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.total} porsi • {item.masakan?.kategori}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        Rp {(item.revenue / 1000).toFixed(0)}k
                      </p>
                      {idx < 3 && (
                        <Star className="w-4 h-4 text-amber-500 fill-current inline" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Revenue by Category */}
          <Card title="Pendapatan per Kategori">
            {reportData.revenueByCategory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {reportData.revenueByCategory.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.category}</span>
                      <span className="font-bold text-gray-800">
                        Rp {(item.revenue / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-blue-600 h-full flex items-center justify-end pr-2"
                        style={{
                          width: `${
                            (item.revenue /
                              Math.max(...reportData.revenueByCategory.map((c) => c.revenue))) *
                            100
                          }%`,
                        }}
                      >
                        <span className="text-xs font-bold text-white">
                          {((item.revenue / reportData.summary.totalRevenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Summary Report */}
        <Card title="Ringkasan Laporan">
          <div className="prose max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">📊 Performa Penjualan</h3>
                <ul className="space-y-2 text-sm">
                  <li>✅ Total pendapatan: Rp {reportData.summary.totalRevenue.toLocaleString('id-ID')}</li>
                  <li>✅ Jumlah transaksi: {reportData.summary.totalOrders}</li>
                  <li>✅ Rata-rata nilai order: Rp {reportData.summary.avgOrderValue.toLocaleString('id-ID')}</li>
                  <li>✅ Total pelanggan unik: {reportData.summary.totalCustomers}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">🏆 Menu Terpopuler</h3>
                <ul className="space-y-2 text-sm">
                  {reportData.topMenu.slice(0, 3).map((item, idx) => (
                    <li key={idx}>
                      #{idx + 1} {item.masakan?.nama_masakan} - {item.total} porsi terjual
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}