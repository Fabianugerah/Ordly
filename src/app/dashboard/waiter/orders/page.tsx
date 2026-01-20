// src/app/dashboard/waiter/orders/page.tsx (UPDATED)
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Package,
  Truck,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WaiterOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [search, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order')
        .select(`
          *,
          users:id_user(nama_user),
          detail_order(*, masakan(*))
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (search) {
      filtered = filtered.filter(
        (order) =>
          order.id_order.toString().includes(search) ||
          order.no_meja.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== 'Semua') {
      filtered = filtered.filter((order) => order.status_order === statusFilter.toLowerCase());
    }

    setFilteredOrders(filtered);
  };

  const handleCompleteOrder = async (orderId: number) => {
    if (!confirm('Konfirmasi pesanan sudah diantar ke meja?')) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('order')
        .update({ status_order: 'selesai' })
        .eq('id_order', orderId);

      if (error) throw error;

      alert('Pesanan berhasil diselesaikan!');
      setShowDetailModal(false);
      fetchOrders();
    } catch (error: any) {
      console.error('Error completing order:', error);
      alert('Gagal menyelesaikan pesanan: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      proses: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      selesai: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      dibatalkan: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'proses':
        return <Truck className="w-4 h-4" />;
      case 'selesai':
        return <CheckCircle className="w-4 h-4" />;
      case 'dibatalkan':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const statusOptions = ['Semua', 'Pending', 'Proses', 'Selesai', 'Dibatalkan'];

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status_order === 'pending').length,
    proses: orders.filter((o) => o.status_order === 'proses').length,
    selesai: orders.filter((o) => o.status_order === 'selesai').length,
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Daftar Pesanan</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor dan antar pesanan ke meja customer</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Proses</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.proses}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Selesai</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.selesai}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari order ID atau meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Tidak ada pesanan ditemukan</p>
                </div>
              </Card>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id_order}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                        Order #{order.id_order}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.tanggal).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBadge(
                        order.status_order
                      )}`}
                    >
                      {getStatusIcon(order.status_order)}
                      {order.status_order.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Meja</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {order.no_meja}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Items</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {order.detail_order?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </Button>
                      {order.status_order === 'proses' && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteOrder(order.id_order)}
                          disabled={processing}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Selesai
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          title={`Detail Order #${selectedOrder?.id_order}`}
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nomor Meja</p>
                  <p className="font-semibold text-lg text-gray-900 dark:text-white">
                    Meja {selectedOrder.no_meja}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBadge(
                      selectedOrder.status_order
                    )}`}
                  >
                    {getStatusIcon(selectedOrder.status_order)}
                    {selectedOrder.status_order.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tanggal</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedOrder.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedOrder.users?.nama_user || '-'}
                  </p>
                </div>
              </div>

              {selectedOrder.keterangan && (
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Keterangan</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white">
                    {selectedOrder.keterangan}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.detail_order?.map((detail: any) => (
                    <div
                      key={detail.id_detail_order}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {detail.masakan?.nama_masakan}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {detail.jumlah} x Rp{' '}
                          {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {selectedOrder.status_order === 'proses' && (
                    <Button
                      onClick={() => handleCompleteOrder(selectedOrder.id_order)}
                      disabled={processing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {processing ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Memproses...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Konfirmasi Sudah Diantar
                        </div>
                      )}
                    </Button>
                  )}

                  {selectedOrder.status_order === 'selesai' && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Pesanan sudah selesai diantar</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}