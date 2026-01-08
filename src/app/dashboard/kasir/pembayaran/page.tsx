'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { CreditCard, Banknote, Smartphone, Search, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';

export default function KasirPembayaranPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');

  const [paymentData, setPaymentData] = useState({
    metode_pembayaran: 'tunai',
    uang_diterima: '',
  });

  useEffect(() => {
    fetchOrders();
    
    // Check if order ID in URL
    const orderId = searchParams.get('order');
    if (orderId) {
      // Find and select that order
      const order = orders.find((o) => o.id_order === parseInt(orderId));
      if (order) {
        handleSelectOrder(order);
      }
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Get orders yang selesai tapi belum dibayar (belum ada transaksi)
      const { data: allOrders } = await supabase
        .from('order')
        .select(`
          *,
          users:id_user(nama_user),
          detail_order(*, masakan(*))
        `)
        .in('status_order', ['selesai', 'proses'])
        .order('created_at', { ascending: false });

      // Check which orders don't have transactions yet
      const { data: transaksiData } = await supabase.from('transaksi').select('id_order');

      const paidOrderIds = new Set(transaksiData?.map((t) => t.id_order) || []);
      const unpaidOrders = allOrders?.filter((o) => !paidOrderIds.has(o.id_order)) || [];

      setOrders(unpaidOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setPaymentData({
      metode_pembayaran: 'tunai',
      uang_diterima: '',
    });
    setShowPaymentModal(true);
  };

  const calculateKembalian = () => {
    if (!selectedOrder || !paymentData.uang_diterima) return 0;
    const uangDiterima = parseFloat(paymentData.uang_diterima);
    const totalHarga = parseFloat(selectedOrder.total_harga);
    return Math.max(0, uangDiterima - totalHarga);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;

    const totalHarga = parseFloat(selectedOrder.total_harga);
    const uangDiterima = parseFloat(paymentData.uang_diterima || '0');

    // Validation
    if (paymentData.metode_pembayaran === 'tunai' && uangDiterima < totalHarga) {
      alert('Uang diterima kurang dari total pembayaran!');
      return;
    }

    setProcessing(true);

    try {
      const transaksiData = {
        id_user: user?.id_user,
        id_order: selectedOrder.id_order,
        tanggal: new Date().toISOString().split('T')[0],
        total_bayar: totalHarga,
        uang_diterima: paymentData.metode_pembayaran === 'tunai' ? uangDiterima : totalHarga,
        kembalian: paymentData.metode_pembayaran === 'tunai' ? calculateKembalian() : 0,
        metode_pembayaran: paymentData.metode_pembayaran,
      };

      const { error } = await supabase.from('transaksi').insert(transaksiData);

      if (error) throw error;

      // Update order status to selesai if not already
      await supabase
        .from('order')
        .update({ status_order: 'selesai' })
        .eq('id_order', selectedOrder.id_order);

      alert('Pembayaran berhasil diproses!');
      setShowPaymentModal(false);
      setSelectedOrder(null);
      fetchOrders();
      router.push('/dashboard/kasir/transaksi');
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id_order.toString().includes(search) ||
      order.no_meja.toLowerCase().includes(search.toLowerCase())
  );

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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Proses Pembayaran</h1>
          <p className="text-gray-600 mt-1">Kelola pembayaran pesanan pelanggan</p>
        </div>

        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari order ID atau meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        {filteredOrders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada pesanan menunggu pembayaran</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id_order} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">Order #{order.id_order}</h3>
                      <p className="text-sm text-gray-600">Meja {order.no_meja}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {order.status_order}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal</span>
                      <span>{new Date(order.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items</span>
                      <span>{order.detail_order?.length || 0}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <Button onClick={() => handleSelectOrder(order)} className="w-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Bayar Sekarang
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
          }}
          title={`Pembayaran Order #${selectedOrder?.id_order}`}
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-primary">
                    Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Meja</p>
                    <p className="font-semibold">{selectedOrder.no_meja}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Items</p>
                    <p className="font-semibold">{selectedOrder.detail_order?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentData({ ...paymentData, metode_pembayaran: 'tunai' })}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      paymentData.metode_pembayaran === 'tunai'
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className="w-8 h-8 text-green-600" />
                    <span className="font-medium text-sm">Tunai</span>
                  </button>
                  <button
                    onClick={() => setPaymentData({ ...paymentData, metode_pembayaran: 'debit' })}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      paymentData.metode_pembayaran === 'debit'
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <span className="font-medium text-sm">Debit</span>
                  </button>
                  <button
                    onClick={() => setPaymentData({ ...paymentData, metode_pembayaran: 'qris' })}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      paymentData.metode_pembayaran === 'qris'
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-8 h-8 text-purple-600" />
                    <span className="font-medium text-sm">QRIS</span>
                  </button>
                </div>
              </div>

              {/* Cash Payment Details */}
              {paymentData.metode_pembayaran === 'tunai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uang Diterima
                  </label>
                  <input
                    type="number"
                    value={paymentData.uang_diterima}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, uang_diterima: e.target.value })
                    }
                    placeholder="Masukkan jumlah uang diterima"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                  />

                  {paymentData.uang_diterima && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">Kembalian</span>
                        <span className="text-2xl font-bold text-green-600">
                          Rp {calculateKembalian().toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleProcessPayment}
                  disabled={
                    processing ||
                    (paymentData.metode_pembayaran === 'tunai' &&
                      parseFloat(paymentData.uang_diterima || '0') <
                        parseFloat(selectedOrder.total_harga))
                  }
                  className="flex-1"
                >
                  {processing ? 'Memproses...' : 'Proses Pembayaran'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOrder(null);
                  }}
                  disabled={processing}
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}