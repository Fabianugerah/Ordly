// src/app/dashboard/waiter/page.tsx (UPDATED)
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  AlertCircle,
  Package,
  Truck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function WaiterDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [stats, setStats] = useState({
    orderMenungguAntar: 0,
    orderSedangDiantar: 0,
    orderSelesaiHariIni: 0,
    totalOrderHariIni: 0,
  });
  
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh setiap 30 detik
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch semua orders
      const { data: allOrders } = await supabase
        .from('order')
        .select('*')
        .order('created_at', { ascending: false });

      const todayOrders = allOrders?.filter((o) => o.tanggal === today) || [];
      
      // Orders yang siap diantar (status = proses atau selesai tapi belum ada transaksi)
      const { data: transaksiData } = await supabase
        .from('transaksi')
        .select('id_order');
      
      const paidOrderIds = new Set(transaksiData?.map(t => t.id_order) || []);
      
      const readyToDeliver = allOrders?.filter(
        (o) => o.status_order === 'proses' && !paidOrderIds.has(o.id_order)
      ) || [];
      
      const delivered = allOrders?.filter(
        (o) => o.status_order === 'selesai' && paidOrderIds.has(o.id_order)
      ) || [];
      
      const deliveredToday = delivered.filter(o => o.tanggal === today);

      setStats({
        orderMenungguAntar: readyToDeliver.length,
        orderSedangDiantar: allOrders?.filter((o) => o.status_order === 'proses').length || 0,
        orderSelesaiHariIni: deliveredToday.length,
        totalOrderHariIni: todayOrders.length,
      });

      setPendingOrders(readyToDeliver.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    if (!confirm('Konfirmasi pesanan sudah diantar ke meja?')) return;

    try {
      const { error } = await supabase
        .from('order')
        .update({ status_order: 'selesai' })
        .eq('id_order', orderId);

      if (error) throw error;

      alert('Pesanan berhasil diselesaikan!');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error completing order:', error);
      alert('Gagal menyelesaikan pesanan: ' + error.message);
    }
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Dashboard Waiter
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Selamat datang, {user?.nama_user}! Antar pesanan ke meja pelanggan
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/waiter/orders')}
            className="flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            Lihat Semua Pesanan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Menunggu Diantar"
            value={stats.orderMenungguAntar}
            icon={Clock}
            color="amber"
            subtitle={stats.orderMenungguAntar > 0 ? 'Perlu segera diantar' : 'Semua sudah diantar'}
          />
          <StatsCard
            title="Sedang Diproses"
            value={stats.orderSedangDiantar}
            icon={Truck}
            color="blue"
            subtitle="Order di dapur"
          />
          <StatsCard
            title="Selesai Hari Ini"
            value={stats.orderSelesaiHariIni}
            icon={CheckCircle}
            color="green"
            subtitle={new Date().toLocaleDateString('id-ID')}
          />
          <StatsCard
            title="Total Order Hari Ini"
            value={stats.totalOrderHariIni}
            icon={TrendingUp}
            color="purple"
            subtitle="Semua pesanan"
          />
        </div>

        {/* Pending Orders to Deliver */}
        <Card title="Pesanan Siap Diantar">
          {stats.orderMenungguAntar > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Ada {stats.orderMenungguAntar} pesanan siap diantar
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Segera antarkan pesanan ke meja customer
                </p>
              </div>
            </div>
          )}

          {pendingOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                Tidak ada pesanan menunggu diantar
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Semua pesanan sudah diantar atau belum ada pesanan baru
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id_order}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800 dark:text-white">
                        Order #{order.id_order}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {order.status_order}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Meja {order.no_meja}
                      </span>
                      <span>•</span>
                      <span>{new Date(order.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                      <p className="font-bold text-lg text-gray-800 dark:text-white">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteOrder(order.id_order)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Selesai
                    </Button>
                  </div>
                </div>
              ))}

              {stats.orderMenungguAntar > 5 && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/waiter/orders')}
                  className="w-full"
                >
                  Lihat Semua ({stats.orderMenungguAntar} pesanan)
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/waiter/orders')}
            className="flex items-center justify-center gap-2 h-14"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Daftar Pesanan</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/waiter/laporan')}
            className="flex items-center justify-center gap-2 h-14"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Laporan Saya</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}