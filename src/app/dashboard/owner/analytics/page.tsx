'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OwnerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // days
  const [analytics, setAnalytics] = useState({
    revenue: {
      current: 0,
      previous: 0,
      growth: 0,
    },
    orders: {
      current: 0,
      previous: 0,
      growth: 0,
    },
    avgOrderValue: {
      current: 0,
      previous: 0,
      growth: 0,
    },
    customers: {
      current: 0,
      previous: 0,
      growth: 0,
    },
    revenueByDay: [] as any[],
    topCustomers: [] as any[],
    peakHours: [] as any[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = parseInt(period);
      const currentStart = new Date();
      currentStart.setDate(currentStart.getDate() - days);
      const previousStart = new Date();
      previousStart.setDate(previousStart.getDate() - days * 2);
      const previousEnd = new Date();
      previousEnd.setDate(previousEnd.getDate() - days);

      // Fetch current period data
      const { data: currentOrders } = await supabase
        .from('order')
        .select('*')
        .gte('tanggal', currentStart.toISOString().split('T')[0])
        .eq('status_order', 'selesai');

      const { data: currentTransaksi } = await supabase
        .from('transaksi')
        .select('*, users(nama_user)')
        .gte('tanggal', currentStart.toISOString().split('T')[0]);

      // Fetch previous period data
      const { data: previousOrders } = await supabase
        .from('order')
        .select('*')
        .gte('tanggal', previousStart.toISOString().split('T')[0])
        .lt('tanggal', previousEnd.toISOString().split('T')[0])
        .eq('status_order', 'selesai');

      const { data: previousTransaksi } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal', previousStart.toISOString().split('T')[0])
        .lt('tanggal', previousEnd.toISOString().split('T')[0]);

      // Calculate revenue
      const currentRevenue = currentTransaksi?.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      ) || 0;
      const previousRevenue = previousTransaksi?.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      ) || 0;
      const revenueGrowth = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Calculate orders
      const currentOrderCount = currentOrders?.length || 0;
      const previousOrderCount = previousOrders?.length || 0;
      const ordersGrowth = previousOrderCount > 0
        ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
        : 0;

      // Calculate avg order value
      const currentAvg = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
      const previousAvg = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
      const avgGrowth = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

      // Calculate unique customers
      const currentCustomers = new Set(currentOrders?.map((o) => o.id_user)).size;
      const previousCustomers = new Set(previousOrders?.map((o) => o.id_user)).size;
      const customersGrowth = previousCustomers > 0
        ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
        : 0;

      // Revenue by day
      const revenueMap: { [key: string]: number } = {};
      currentTransaksi?.forEach((t) => {
        if (!revenueMap[t.tanggal]) revenueMap[t.tanggal] = 0;
        revenueMap[t.tanggal] += parseFloat(t.total_bayar.toString());
      });

      const revenueByDay = Object.entries(revenueMap)
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

      // Top customers
      const customerSpending: { [key: number]: { total: number; count: number; user?: any } } = {};
      currentTransaksi?.forEach((t) => {
        if (!customerSpending[t.id_user]) {
          customerSpending[t.id_user] = { total: 0, count: 0, user: t.users };
        }
        customerSpending[t.id_user].total += parseFloat(t.total_bayar.toString());
        customerSpending[t.id_user].count += 1;
      });

      const topCustomers = Object.entries(customerSpending)
        .map(([userId, data]) => ({
          userId: parseInt(userId),
          ...data,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setAnalytics({
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth,
        },
        orders: {
          current: currentOrderCount,
          previous: previousOrderCount,
          growth: ordersGrowth,
        },
        avgOrderValue: {
          current: currentAvg,
          previous: previousAvg,
          growth: avgGrowth,
        },
        customers: {
          current: currentCustomers,
          previous: previousCustomers,
          growth: customersGrowth,
        },
        revenueByDay,
        topCustomers,
        peakHours: [], // To be implemented with time data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-semibold">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-800">Business Analytics</h1>
            <p className="text-gray-600 mt-1">Analisis mendalam performa bisnis</p>
          </div>
          <div className="flex gap-2">
            {['7', '30', '90'].map((days) => (
              <Button
                key={days}
                onClick={() => setPeriod(days)}
                variant={period === days ? 'primary' : 'outline'}
                size="sm"
              >
                {days} Hari
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
              <GrowthIndicator value={analytics.revenue.growth} />
            </div>
            <p className="text-green-100 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold">
              Rp {(analytics.revenue.current / 1000000).toFixed(1)}jt
            </p>
            <p className="text-green-100 text-xs mt-2">
              vs Rp {(analytics.revenue.previous / 1000000).toFixed(1)}jt periode sebelumnya
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8" />
              <GrowthIndicator value={analytics.orders.growth} />
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold">{analytics.orders.current}</p>
            <p className="text-blue-100 text-xs mt-2">
              vs {analytics.orders.previous} periode sebelumnya
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <GrowthIndicator value={analytics.avgOrderValue.growth} />
            </div>
            <p className="text-purple-100 text-sm mb-1">Avg Order Value</p>
            <p className="text-3xl font-bold">
              Rp {(analytics.avgOrderValue.current / 1000).toFixed(0)}k
            </p>
            <p className="text-purple-100 text-xs mt-2">
              vs Rp {(analytics.avgOrderValue.previous / 1000).toFixed(0)}k periode sebelumnya
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
              <GrowthIndicator value={analytics.customers.growth} />
            </div>
            <p className="text-amber-100 text-sm mb-1">Unique Customers</p>
            <p className="text-3xl font-bold">{analytics.customers.current}</p>
            <p className="text-amber-100 text-xs mt-2">
              vs {analytics.customers.previous} periode sebelumnya
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card title="Revenue Trend (7 Hari Terakhir)">
            <div className="space-y-3">
              {analytics.revenueByDay.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tidak ada data</p>
              ) : (
                analytics.revenueByDay.map((data, idx) => (
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
                              Math.max(...analytics.revenueByDay.map((d) => d.revenue))) *
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

          {/* Top Customers */}
          <Card title="Top Spending Customers">
            {analytics.topCustomers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data</p>
            ) : (
              <div className="space-y-3">
                {analytics.topCustomers.map((customer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-white font-bold rounded-full">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {customer.user?.nama_user || `Customer #${customer.userId}`}
                      </p>
                      <p className="text-sm text-gray-600">{customer.count} transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        Rp {(customer.total / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Insights */}
        <Card title="Business Insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📈 Revenue Growth</h4>
              <p className="text-sm text-blue-800">
                {analytics.revenue.growth >= 0
                  ? `Revenue meningkat ${analytics.revenue.growth.toFixed(1)}% dibanding periode sebelumnya`
                  : `Revenue turun ${Math.abs(analytics.revenue.growth).toFixed(1)}% dibanding periode sebelumnya`}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">🎯 Best Performance</h4>
              <p className="text-sm text-green-800">
                {analytics.revenueByDay.length > 0 &&
                  `Hari terbaik: ${
                    analytics.revenueByDay.reduce((best, day) =>
                      day.revenue > best.revenue ? day : best
                    ).formattedDate
                  }`}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">💰 Average Spending</h4>
              <p className="text-sm text-purple-800">
                Rata-rata pengeluaran per customer: Rp{' '}
                {analytics.customers.current > 0
                  ? (analytics.revenue.current / analytics.customers.current / 1000).toFixed(0)
                  : 0}
                k
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-semibold text-amber-900 mb-2">🔥 Customer Activity</h4>
              <p className="text-sm text-amber-800">
                {analytics.customers.growth >= 0
                  ? `Customer base tumbuh ${analytics.customers.growth.toFixed(1)}%`
                  : `Customer base turun ${Math.abs(analytics.customers.growth).toFixed(1)}%`}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}