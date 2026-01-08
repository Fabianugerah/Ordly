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
  CreditCard,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KasirOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const checkIfPaid = async (orderId: number) => {
    const { data } = await supabase
      .from('transaksi')
      .select('id_transaksi')
      .eq('id_order', orderId)
      .single();

    return !!data;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      proses: 'bg-blue-100 text-blue-800 border-blue-200',
      selesai: 'bg-green-100 text-green-800 border-green-200',
      dibatalkan: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statusOptions = ['Semua', 'Pending', 'Proses', 'Selesai'];

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status_order === 'pending').length,
    proses: orders.filter((o) => o.status_order === 'proses').length,
    selesai: orders.filter((o) => o.status_order === 'selesai').length,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Daftar Pesanan</h1>
            <p className="text-gray-600 mt-1">Monitor semua pesanan untuk pembayaran</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-amber-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-blue-600 mb-1">Proses</p>
            <p className="text-2xl font-bold text-blue-600">{stats.proses}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-green-600 mb-1">Selesai</p>
            <p className="text-2xl font-bold text-green-600">{stats.selesai}</p>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada pesanan ditemukan</p>
                </div>
              </Card>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id_order} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">Order #{order.id_order}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.tanggal).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        order.status_order
                      )}`}
                    >
                      {order.status_order.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Meja</span>
                      <span className="font-semibold">{order.no_meja}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Waiter</span>
                      <span className="font-semibold">{order.users?.nama_user || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items</span>
                      <span className="font-semibold">{order.detail_order?.length || 0}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Total</span>
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
                      {(order.status_order === 'selesai' || order.status_order === 'proses') && (
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/kasir/pembayaran?order=${order.id_order}`)
                          }
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          Bayar
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
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Nomor Meja</p>
                  <p className="font-semibold text-lg">Meja {selectedOrder.no_meja}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                      selectedOrder.status_order
                    )}`}
                  >
                    {selectedOrder.status_order.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Waiter</p>
                  <p className="font-semibold">{selectedOrder.users?.nama_user || '-'}</p>
                </div>
              </div>

              {selectedOrder.keterangan && (
                <div className="pb-4 border-b">
                  <p className="text-sm text-gray-600 mb-1">Keterangan</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedOrder.keterangan}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.detail_order?.map((detail: any) => (
                    <div
                      key={detail.id_detail_order}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {detail.masakan?.nama_masakan}
                        </p>
                        <p className="text-sm text-gray-600">
                          {detail.jumlah} x Rp{' '}
                          {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {(selectedOrder.status_order === 'selesai' ||
                    selectedOrder.status_order === 'proses') && (
                    <Button
                      onClick={() => {
                        setShowDetailModal(false);
                        router.push(`/dashboard/kasir/pembayaran?order=${selectedOrder.id_order}`);
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      Proses Pembayaran
                    </Button>
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