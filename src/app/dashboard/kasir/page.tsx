// src/app/dashboard/kasir/page.tsx (UPDATED)
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Receipt, 
  Clock, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Banknote,
  QrCode,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function KasirDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [stats, setStats] = useState({
    transaksiHariIni: 0,
    pendapatanHariIni: 0,
    orderMenunggu: 0,
    totalTransaksi: 0,
    transaksiSaya: 0,
  });
  
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    tunai: 0,
    debit: 0,
    qris: 0,
  });
  
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
      
      // Fetch orders dan transaksi secara parallel
      const [
        { data: orders },
        { data: transaksi },
      ] = await Promise.all([
        supabase
          .from('order')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('transaksi')
          .select('*, users:id_user(nama_user), order:id_order(no_meja)')
          .order('created_at', { ascending: false }),
      ]);

      const today = new Date().toISOString().split('T')[0];
      
      // Filter transaksi hari ini
      const todayTransaksi = transaksi?.filter((t) => t.tanggal === today) || [];
      
      // Filter transaksi yang dibuat oleh kasir ini
      const myTransaksi = transaksi?.filter((t) => t.id_user === user?.id_user) || [];
      
      // Hitung pendapatan hari ini
      const pendapatanHariIni = todayTransaksi.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      );

      // Orders yang belum ada transaksinya (belum dibayar)
      const transaksiOrderIds = new Set(transaksi?.map(t => t.id_order) || []);
      const orderMenunggu = orders?.filter(
        (o) => 
          (o.status_order === 'selesai' || o.status_order === 'proses') && 
          !transaksiOrderIds.has(o.id_order)
      ) || [];

      // Payment method breakdown untuk hari ini
      const breakdown = {
        tunai: todayTransaksi.filter(t => t.metode_pembayaran === 'tunai').length,
        debit: todayTransaksi.filter(t => t.metode_pembayaran === 'debit').length,
        qris: todayTransaksi.filter(t => t.metode_pembayaran === 'qris').length,
      };

      setStats({
        transaksiHariIni: todayTransaksi.length,
        pendapatanHariIni,
        orderMenunggu: orderMenunggu.length,
        totalTransaksi: transaksi?.length || 0,
        transaksiSaya: myTransaksi.length,
      });

      setPendingOrders(orderMenunggu.slice(0, 5));
      setRecentTransactions(todayTransaksi.slice(0, 5));
      setPaymentBreakdown(breakdown);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (metode: string) => {
    const metodeStr = metode.toLowerCase();
    if (metodeStr === 'tunai') return <Banknote className="w-4 h-4" />;
    if (metodeStr === 'qris') return <QrCode className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  const getPaymentBadge = (metode: string) => {
    const metodeStr = metode.toLowerCase();
    const styles = {
      tunai: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      debit: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      qris: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    };
    return styles[metodeStr as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentLabel = (metode: string) => {
    const metodeStr = metode.toLowerCase();
    const labels = {
      tunai: 'Tunai',
      debit: 'Debit/Transfer',
      qris: 'QRIS/E-Wallet',
    };
    return labels[metodeStr as keyof typeof labels] || metode.toUpperCase();
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Kasir</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Selamat datang, {user?.nama_user}! Kelola pembayaran dan transaksi hari ini
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/kasir/pembayaran')}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Proses Pembayaran
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pendapatan Hari Ini"
            value={`Rp ${(stats.pendapatanHariIni / 1000).toFixed(0)}k`}
            icon={DollarSign}
            color="green"
            subtitle={new Date().toLocaleDateString('id-ID')}
          />
          <StatsCard
            title="Transaksi Hari Ini"
            value={stats.transaksiHariIni}
            icon={Receipt}
            color="blue"
            subtitle={`${stats.transaksiSaya} transaksi saya`}
          />
          <StatsCard
            title="Menunggu Pembayaran"
            value={stats.orderMenunggu}
            icon={Clock}
            color="amber"
            subtitle={stats.orderMenunggu > 0 ? 'Perlu segera diproses' : 'Semua sudah dibayar'}
          />
          <StatsCard
            title="Total Transaksi"
            value={stats.totalTransaksi}
            icon={TrendingUp}
            color="purple"
            subtitle="Semua waktu"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders - 2 columns */}
          <div className="lg:col-span-2">
            <Card title="Pesanan Menunggu Pembayaran">
              {stats.orderMenunggu > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      Ada {stats.orderMenunggu} pesanan menunggu pembayaran
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Segera proses pembayaran untuk menyelesaikan transaksi
                    </p>
                  </div>
                </div>
              )}

              {pendingOrders.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                    Tidak ada pesanan menunggu pembayaran
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Semua pesanan sudah dibayar atau belum ada pesanan baru
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
                          <span>Meja {order.no_meja}</span>
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
                          onClick={() =>
                            router.push(`/dashboard/kasir/pembayaran?order=${order.id_order}`)
                          }
                        >
                          Bayar
                        </Button>
                      </div>
                    </div>
                  ))}

                  {stats.orderMenunggu > 5 && (
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/kasir/pembayaran')}
                      className="w-full"
                    >
                      Lihat Semua ({stats.orderMenunggu} pesanan)
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Payment Breakdown - 1 column */}
          <div>
            <Card title="Metode Pembayaran Hari Ini">
              <div className="space-y-4">
                {/* Tunai */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-white">Tunai</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {paymentBreakdown.tunai}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pembayaran cash</p>
                </div>

                {/* Debit/Transfer */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-white">Debit/Transfer</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {paymentBreakdown.debit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Transfer bank & kartu debit</p>
                </div>

                {/* QRIS/E-Wallet */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <QrCode className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-white">QRIS/E-Wallet</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {paymentBreakdown.qris}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">GoPay, OVO, DANA, dll</p>
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Total Transaksi</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.transaksiHariIni}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Transactions */}
        <Card title="Transaksi Terbaru Hari Ini">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Waktu</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Meja</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Kasir</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Metode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTransactions.map((t) => (
                    <tr key={t.id_transaksi} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        #{t.id_transaksi}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(t.created_at).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        Meja {t.order?.no_meja || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {t.users?.nama_user || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(t.metode_pembayaran)}`}>
                          {getPaymentIcon(t.metode_pembayaran)}
                          {getPaymentLabel(t.metode_pembayaran)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
                        Rp {parseFloat(t.total_bayar).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recentTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/kasir/transaksi')}
                className="w-full"
              >
                Lihat Semua Transaksi
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/kasir/pembayaran')}
            className="flex items-center justify-center gap-2 h-14"
          >
            <CreditCard className="w-5 h-5" />
            <span>Proses Pembayaran</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/kasir/transaksi')}
            className="flex items-center justify-center gap-2 h-14"
          >
            <Receipt className="w-5 h-5" />
            <span>Riwayat Transaksi</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/kasir/laporan')}
            className="flex items-center justify-center gap-2 h-14"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Laporan Kasir</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}