// src/app/dashboard/kasir/pembayaran/page.tsx (UPDATED)
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { CreditCard, Banknote, Smartphone, Search, CheckCircle, QrCode, Wallet, Building2 } from 'lucide-react';
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
    
    const orderId = searchParams.get('order');
    if (orderId) {
      const order = orders.find((o) => o.id_order === parseInt(orderId));
      if (order) {
        handleSelectOrder(order);
      }
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: allOrders } = await supabase
        .from('order')
        .select(`
          *,
          users:id_user(nama_user),
          detail_order(*, masakan(*))
        `)
        .in('status_order', ['selesai', 'proses'])
        .order('created_at', { ascending: false });

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

  // Payment method details
  const paymentMethods = [
    {
      id: 'tunai',
      name: 'Tunai',
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      description: 'Pembayaran cash langsung'
    },
    {
      id: 'debit',
      name: 'Debit/Transfer',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      description: 'Kartu debit atau transfer bank'
    },
    {
      id: 'qris',
      name: 'QRIS/E-Wallet',
      icon: QrCode,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      description: 'Scan QR atau e-wallet digital'
    },
  ];

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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Proses Pembayaran</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola pembayaran pesanan customer</p>
        </div>

        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari order ID atau meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </Card>

        {filteredOrders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Tidak ada pesanan menunggu pembayaran</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id_order} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">Order #{order.id_order}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Meja {order.no_meja}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                      {order.status_order}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tanggal</span>
                      <span className="text-gray-900 dark:text-white">{new Date(order.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Items</span>
                      <span className="text-gray-900 dark:text-white">{order.detail_order?.length || 0}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
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
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-primary">
                    Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Meja</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.no_meja}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Items</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.detail_order?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection - Updated Design */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Metode Pembayaran
                </label>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentData.metode_pembayaran === method.id;
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentData({ ...paymentData, metode_pembayaran: method.id })}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `${method.borderColor} ${method.bgColor}`
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg ${method.bgColor} flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${method.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{method.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {method.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle className={`w-5 h-5 ${method.color}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Info untuk metode non-tunai */}
                {paymentData.metode_pembayaran !== 'tunai' && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      💡 <strong>Info:</strong> {
                        paymentData.metode_pembayaran === 'qris' 
                          ? 'Termasuk pembayaran via GoPay, OVO, DANA, atau scan QRIS lainnya'
                          : 'Termasuk transfer bank (BCA, Mandiri, BNI, dll) atau kartu debit'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Cash Payment Details */}
              {paymentData.metode_pembayaran === 'tunai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uang Diterima
                  </label>
                  <input
                    type="number"
                    value={paymentData.uang_diterima}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, uang_diterima: e.target.value })
                    }
                    placeholder="Masukkan jumlah uang diterima"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                  {paymentData.uang_diterima && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Kembalian</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
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