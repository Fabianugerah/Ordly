'use client';

import { useEffect, useState, Suspense } from 'react'; // 1. Import Suspense
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { CreditCard, Banknote, Smartphone, Search, CheckCircle, QrCode, Wallet, Building2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';

// 2. Ubah nama function menjadi PembayaranContent (bukan default export)
function PembayaranContent() {
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
  }, [searchParams, orders]); // Tambahkan orders ke dependency agar saat data load, param dicek ulang

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

  const paymentMethods = [
    {
      id: 'tunai',
      name: 'Tunai',
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-500',
      activeBg: 'bg-green-50 dark:bg-green-900/20',
      description: 'Pembayaran cash langsung'
    },
    {
      id: 'debit',
      name: 'Debit / Transfer',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-blue-500',
      activeBg: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Kartu Debit atau Transfer Bank'
    },
    {
      id: 'qris',
      name: 'QRIS / E-Wallet',
      icon: QrCode,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      borderColor: 'border-purple-500',
      activeBg: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Scan QR atau E-Wallet'
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
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Kasir</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Pilih pesanan untuk memproses pembayaran</p>
        </div>

        <Card>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari Order ID atau Nomor Meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>
        </Card>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Tidak ada pesanan yang belum dibayar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div 
                key={order.id_order} 
                onClick={() => handleSelectOrder(order)} 
                className="cursor-pointer"
              >
                <Card className="hover:shadow-lg transition-shadow group h-full">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-neutral-800 dark:text-white group-hover:text-orange-500 transition-colors">
                          Order #{order.id_order}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700">
                            Meja {order.no_meja}
                          </span>
                          <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md border border-blue-100 dark:border-blue-800">
                            {order.status_order}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-4 border-t border-b border-neutral-100 dark:border-neutral-800 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">Tanggal</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{new Date(order.tanggal).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">Waiter</span>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-neutral-400" />
                          <span className="text-neutral-900 dark:text-white font-medium">{order.users?.nama_user || '-'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">Total Items</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{order.detail_order?.length || 0} item</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Tagihan</span>
                      <span className="text-xl font-bold text-neutral-900 dark:text-white">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <Button className="w-full mt-2">
                      Proses Pembayaran
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Modal Pembayaran */}
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
              
              <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black opacity-10 rounded-full blur-xl"></div>
                
                <div className="relative z-10 text-center">
                  <p className="text-orange-100 text-sm font-medium mb-1">Total Harus Dibayar</p>
                  <p className="text-4xl font-bold tracking-tight">
                    Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                  </p>
                </div>
                
                <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                   <div className="text-center">
                      <p className="text-orange-100 text-xs uppercase tracking-wider">Meja</p>
                      <p className="font-semibold text-lg">{selectedOrder.no_meja}</p>
                   </div>
                   <div className="text-center border-l border-white/20">
                      <p className="text-orange-100 text-xs uppercase tracking-wider">Items</p>
                      <p className="font-semibold text-lg">{selectedOrder.detail_order?.length} Menu</p>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-white mb-3 ml-1">
                  Pilih Metode Pembayaran
                </label>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentData.metode_pembayaran === method.id;
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentData({ ...paymentData, metode_pembayaran: method.id })}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden group
                          ${isSelected 
                            ? `${method.borderColor} ${method.activeBg}` 
                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                          }`}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-white shadow-sm' : method.bgColor}`}>
                            <Icon className={`w-6 h-6 ${method.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                {method.name}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {method.description}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                             ${isSelected ? `${method.borderColor} bg-current text-white` : 'border-neutral-300 dark:border-neutral-600'}`}>
                             {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${method.color.replace('text-', 'bg-')}`} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentData.metode_pembayaran === 'tunai' && (
                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-2">
                    Nominal Uang Diterima
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">Rp</span>
                    <input
                      type="number"
                      value={paymentData.uang_diterima}
                      onChange={(e) => setPaymentData({ ...paymentData, uang_diterima: e.target.value })}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 text-lg font-bold border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                      autoFocus
                    />
                  </div>

                  {paymentData.uang_diterima && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-600 dark:text-neutral-400 font-medium">Kembalian Customer</span>
                        <span className={`text-xl font-bold ${calculateKembalian() > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-900 dark:text-white'}`}>
                          Rp {calculateKembalian().toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOrder(null);
                  }}
                  disabled={processing}
                  className="flex-1 py-3"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleProcessPayment}
                  disabled={
                    processing ||
                    (paymentData.metode_pembayaran === 'tunai' &&
                      parseFloat(paymentData.uang_diterima || '0') < parseFloat(selectedOrder.total_harga))
                  }
                  className="flex-[2] py-3 text-lg"
                >
                  {processing ? 'Memproses...' : 'Konfirmasi Bayar'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

// 3. Export Default Baru (Suspense Wrapper)
export default function KasirPembayaranPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <PembayaranContent />
    </Suspense>
  );
}