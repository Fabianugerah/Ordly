'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function CustomerOrdersListPage() {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('order')
        .select('*, detail_order(*, masakan(*))')
        .eq('id_user', user?.id_user)
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      proses: 'bg-blue-100 text-blue-800',
      selesai: 'bg-green-100 text-green-800',
      dibatalkan: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'proses':
        return <Clock className="w-5 h-5 animate-pulse" />;
      case 'selesai':
        return <CheckCircle className="w-5 h-5" />;
      case 'dibatalkan':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pesanan Saya</h1>
          <p className="text-gray-600 mt-1">Riwayat dan status pesanan Anda</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Anda belum memiliki pesanan</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id_order}
                  className={`cursor-pointer transition-all ${
                    selectedOrder?.id_order === order.id_order
                      ? 'ring-2 ring-primary'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        Order #{order.id_order}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.tanggal).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status_order)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Meja {order.no_meja}</p>
                      <p className="text-lg font-bold text-primary">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        order.status_order
                      )}`}
                    >
                      {order.status_order.toUpperCase()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Detail */}
            <div>
              {selectedOrder ? (
                <Card title={`Detail Order #${selectedOrder.id_order}`}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      <div>
                        <p className="text-sm text-gray-600">Nomor Meja</p>
                        <p className="font-semibold">{selectedOrder.no_meja}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            selectedOrder.status_order
                          )}`}
                        >
                          {selectedOrder.status_order.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tanggal</p>
                        <p className="font-semibold">
                          {new Date(selectedOrder.tanggal).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-semibold text-primary">
                          Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {selectedOrder.keterangan && (
                      <div className="pb-4 border-b">
                        <p className="text-sm text-gray-600 mb-1">Keterangan</p>
                        <p className="text-sm">{selectedOrder.keterangan}</p>
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
                            <p className="font-semibold">
                              Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <p className="text-gray-500">Pilih pesanan untuk melihat detail</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}