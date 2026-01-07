'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [search, statusFilter, dateFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order')
        .select(`
          *,
          users:id_user(nama_user, username),
          detail_order(
            *,
            masakan(nama_masakan, harga, kategori)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search (table number or order ID)
    if (search) {
      filtered = filtered.filter(
        (order) =>
          order.id_order.toString().includes(search) ||
          order.no_meja.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'Semua') {
      filtered = filtered.filter(
        (order) => order.status_order === statusFilter.toLowerCase()
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter((order) => order.tanggal === dateFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('order')
        .update({ status_order: newStatus })
        .eq('id_order', orderId);

      if (error) throw error;

      // Also update detail orders status
      await supabase
        .from('detail_order')
        .update({ status_detail_order: newStatus })
        .eq('id_order', orderId);

      alert('Status berhasil diupdate!');
      setShowStatusModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleChangeStatus = (order: any) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'proses':
        return <RefreshCw className="w-4 h-4" />;
      case 'selesai':
        return <CheckCircle className="w-4 h-4" />;
      case 'dibatalkan':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const statusOptions = ['Semua', 'Pending', 'Proses', 'Selesai', 'Dibatalkan'];

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status_order === 'pending').length,
    proses: orders.filter((o) => o.status_order === 'proses').length,
    selesai: orders.filter((o) => o.status_order === 'selesai').length,
    dibatalkan: orders.filter((o) => o.status_order === 'dibatalkan').length,
    totalRevenue: orders
      .filter((o) => o.status_order === 'selesai')
      .reduce((sum, o) => sum + parseFloat(o.total_harga), 0),
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
            <h1 className="text-3xl font-bold text-gray-800">Manajemen Pesanan</h1>
            <p className="text-gray-600 mt-1">Kelola semua pesanan restoran</p>
          </div>
          <Button
            onClick={fetchOrders}
            className="flex items-center gap-2"
            variant="outline"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <Card className="text-center">
            <p className="text-sm text-red-600 mb-1">Dibatalkan</p>
            <p className="text-2xl font-bold text-red-600">{stats.dibatalkan}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-green-600 mb-1">Revenue</p>
            <p className="text-lg font-bold text-green-600">
              Rp {(stats.totalRevenue / 1000).toFixed(0)}k
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari order ID atau nomor meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto">
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

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Meja
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Waiter
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>Tidak ada pesanan ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id_order} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        #{order.id_order}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(order.tanggal).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                        Meja {order.no_meja}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.users?.nama_user || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.detail_order?.length || 0} item
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            order.status_order
                          )}`}
                        >
                          {getStatusIcon(order.status_order)}
                          {order.status_order.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(order)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleChangeStatus(order)}
                            className="text-green-600 hover:text-green-800"
                            title="Change Status"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

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
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Nomor Meja</p>
                  <p className="font-semibold text-lg">Meja {selectedOrder.no_meja}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                      selectedOrder.status_order
                    )}`}
                  >
                    {getStatusIcon(selectedOrder.status_order)}
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
                  <p className="font-semibold">
                    {selectedOrder.users?.nama_user || '-'}
                  </p>
                </div>
              </div>

              {/* Keterangan */}
              {selectedOrder.keterangan && (
                <div className="pb-4 border-b">
                  <p className="text-sm text-gray-600 mb-1">Keterangan</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.keterangan}
                  </p>
                </div>
              )}

              {/* Order Items */}
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
                        {detail.masakan?.kategori && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {detail.masakan.kategori}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-800">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Status Update Modal */}
        <Modal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
          }}
          title={`Update Status Order #${selectedOrder?.id_order}`}
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status Saat Ini:</p>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                    selectedOrder.status_order
                  )}`}
                >
                  {getStatusIcon(selectedOrder.status_order)}
                  {selectedOrder.status_order.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Pilih Status Baru:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id_order, 'pending')
                    }
                    variant="outline"
                    className="justify-center"
                    disabled={selectedOrder.status_order === 'pending'}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id_order, 'proses')
                    }
                    className="justify-center bg-blue-600 hover:bg-blue-700"
                    disabled={selectedOrder.status_order === 'proses'}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Proses
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id_order, 'selesai')
                    }
                    className="justify-center bg-green-600 hover:bg-green-700"
                    disabled={selectedOrder.status_order === 'selesai'}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Selesai
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id_order, 'dibatalkan')
                    }
                    variant="danger"
                    className="justify-center"
                    disabled={selectedOrder.status_order === 'dibatalkan'}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Batalkan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}