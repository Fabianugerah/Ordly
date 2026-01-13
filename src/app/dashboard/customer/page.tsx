'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ShoppingCart, Clock, CheckCircle, Plus, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    totalOrders: 0,
    orderPending: 0,
    orderSelesai: 0,
  });
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: orders } = await supabase
        .from('order')
        .select('*')
        .eq('id_user', user?.id_user)
        .order('created_at', { ascending: false });

      setStats({
        totalOrders: orders?.length || 0,
        orderPending: orders?.filter((o) => o.status_order === 'pending').length || 0,
        orderSelesai: orders?.filter((o) => o.status_order === 'selesai').length || 0,
      });

      setMyOrders(orders?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['customer']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Selamat Datang, {user?.nama_user}! 👋</h1>
          <p className="text-blue-100 mb-6">
            Nikmati pengalaman memesan makanan yang mudah dan cepat
          </p>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard/customer/menu')}
              className="flex items-center gap-2"
            >
              <UtensilsCrossed className="w-5 h-5" />
              Lihat Menu
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/customer/order')}
              className="flex items-center gap-2 bg-white text-primary hover:bg-gray-100"
            >
              <Plus className="w-5 h-5" />
              Buat Pesanan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Pesanan"
            value={stats.totalOrders}
            icon={ShoppingCart}
            color="blue"
          />
          <StatsCard
            title="Pesanan Pending"
            value={stats.orderPending}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="Pesanan Selesai"
            value={stats.orderSelesai}
            icon={CheckCircle}
            color="green"
          />
        </div>

        <Card title="Pesanan Saya">
          {myOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Anda belum memiliki pesanan</p>
              <Button onClick={() => router.push('/dashboard/customer/menu')}>
                Mulai Pesan Sekarang
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <div
                  key={order.id_order}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      Order #{order.id_order} - Meja {order.no_meja}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.tanggal).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                    </p>
                    <span
                      className={`text-xs px-3 py-1 rounded-full inline-block mt-1 ${
                        order.status_order === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status_order === 'proses'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {order.status_order.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}