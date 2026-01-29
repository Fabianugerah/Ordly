// src/app/guest/payment/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  QrCode,
  Wallet,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore'; // 1. IMPORT CART STORE
import { paymentService, PAYMENT_METHODS } from '@/lib/services/paymentService';
import PaymentSteps from '@/components/payment/PaymentSteps';
import Navbar from '@/components/layout/NavbarCustomer';
import Footer from '@/components/layout/FooterCustomer';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const { addItem } = useCartStore(); // 2. AMBIL FUNGSI ADD ITEM

  const [order, setOrder] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false); // State untuk loading batal
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (orderId) {
      fetchOrderDetails(parseInt(orderId));
    } else {
      router.push('/guest/orders');
    }
  }, [searchParams]);

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order')
        .select(`
          *,
          detail_order(*, masakan(*))
        `)
        .eq('id_order', orderId)
        .single();

      if (error) throw error;

      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id_order', orderId)
        .single();

      if (transaksi) {
        router.push(`/guest/receipt?transaksi=${transaksi.id_transaksi}`);
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Gagal memuat detail pesanan');
      router.push('/guest/orders');
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNGSI BARU: MENANGANI TOMBOL BACK
  const handleBackToOrder = async () => {
    if (!order) return;
    
    // Konfirmasi pembatalan (Opsional, bisa dihapus jika ingin langsung)
    if (!confirm('Kembali ke menu order? Pesanan saat ini akan dibatalkan agar Anda bisa mengubah menu.')) {
        return;
    }

    setCancelling(true);

    try {
        // A. Kembalikan item ke Cart Store
        if (order.detail_order) {
            order.detail_order.forEach((detail: any) => {
                // Pastikan struktur object sesuai dengan yang diterima addItem di store Anda
                addItem({
                    id_masakan: detail.masakan.id_masakan,
                    nama_masakan: detail.masakan.nama_masakan,
                    harga: detail.harga_satuan,
                    gambar: detail.masakan.gambar,
                    kategori: detail.masakan.kategori,
                    status_masakan: detail.masakan.status_masakan
                });
                // Note: addItem biasanya nambah 1, jika store support quantity banyak, 
                // Anda mungkin perlu loop atau sesuaikan logic storenya. 
                // Jika addItem hanya nambah 1, kita loop sejumlah qty:
                for(let i = 1; i < detail.jumlah; i++) {
                    addItem({
                        id_masakan: detail.masakan.id_masakan,
                        nama_masakan: detail.masakan.nama_masakan,
                        harga: detail.harga_satuan,
                        gambar: detail.masakan.gambar,
                        kategori: detail.masakan.kategori,
                        status_masakan: detail.masakan.status_masakan
                    });
                }
            });
        }

        // B. Hapus Order dari Database (Agar meja kosong kembali)
        const { error } = await supabase
            .from('order')
            .delete()
            .eq('id_order', order.id_order);

        if (error) throw error;

        // C. Redirect kembali ke halaman Order
        router.push('/guest/order'); // Pastikan rute ini benar (singular/plural)

    } catch (error) {
        console.error("Gagal membatalkan pesanan:", error);
        alert("Gagal kembali ke menu order.");
    } finally {
        setCancelling(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert('Silakan pilih metode pembayaran');
      return;
    }

    const method = paymentService.getPaymentMethodById(selectedMethod);
    if (!method) return;

    setProcessing(true);

    try {
      const response = await paymentService.createSelfPayment({
        id_order: order.id_order,
        id_user: user?.id_user!,
        total_bayar: order.total_harga,
        metode_pembayaran: method.value,
        payment_type: method.type as 'qris' | 'ewallet' | 'bank_transfer',
        payment_details: {
          provider: selectedMethod,
        },
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      setPaymentInfo(response.payment_info);

      setTimeout(() => {
        router.push(`/guest/receipt?transaksi=${response.transaksi.id_transaksi}`);
      }, 3000);

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || cancelling) { // Tambahkan state cancelling
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            {cancelling && <p className="text-white text-sm">Membatalkan pesanan & mengembalikan keranjang...</p>}
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <main className="flex-1">
        {/* Header & Back Button (Sticky Sub-header) */}
        <div className="sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
            <button
              onClick={handleBackToOrder} // 4. GANTI ONCLICK DI SINI
              disabled={processing || cancelling}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Back To Checkout</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          
          <PaymentSteps currentStep={2} />

          {paymentInfo ? (
            /* --- Payment Processing View --- */
            <div className="max-w-md mx-auto mt-12 text-center animate-fade-in">
               <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
               </div>
               <h2 className="text-2xl font-bold mb-2">Menunggu Pembayaran</h2>
               <p className="text-neutral-500 dark:text-neutral-400 mb-8">Selesaikan pembayaran Anda dalam waktu 15 menit</p>
               
               <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                  {paymentInfo.qr_code && (
                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={paymentInfo.qr_code} alt="QR Code" width={200} height={200} />
                    </div>
                  )}
                  {paymentInfo.virtual_account && (
                     <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl mb-4 border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 mb-1">Virtual Account</p>
                        <div className="flex items-center justify-center gap-3">
                           <span className="text-2xl font-mono font-bold tracking-wider">{paymentInfo.virtual_account}</span>
                           <button onClick={() => copyToClipboard(paymentInfo.virtual_account)}>
                              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                           </button>
                        </div>
                     </div>
                  )}
                  <p className="text-sm text-neutral-500">Otomatis diarahkan setelah pembayaran berhasil...</p>
               </Card>
            </div>
          ) : (
            /* --- Selection View (Two Columns) --- */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Metode Pembayaran</h2>
                  
                  {/* Group: E-Wallet / QRIS */}
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-4">
                     <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                           <QrCode className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">QRIS & E-Wallet</span>
                     </div>
                     <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PAYMENT_METHODS.filter(m => m.type === 'qris' || m.type === 'ewallet').map((method) => (
                           <button
                              key={method.id}
                              onClick={() => setSelectedMethod(method.id)}
                              className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all h-32
                                 ${selectedMethod === method.id 
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' 
                                    : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
                                 }`}
                           >
                              <span className="text-3xl">{method.icon}</span>
                              <span className="text-xs font-medium text-center">{method.name}</span>
                              {selectedMethod === method.id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Group: Bank Transfer */}
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                     <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                           <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Transfer Bank</span>
                     </div>
                     <div className="p-4 space-y-3">
                        {PAYMENT_METHODS.filter(m => m.type === 'bank_transfer').map((method) => (
                           <button
                              key={method.id}
                              onClick={() => setSelectedMethod(method.id)}
                              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all
                                 ${selectedMethod === method.id 
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-600' 
                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 bg-white dark:bg-neutral-900'
                                 }`}
                           >
                              <div className="flex items-center gap-4">
                                 <div className="text-2xl w-10 text-center">{method.icon}</div>
                                 <div className="text-left">
                                    <p className="font-semibold text-sm">{method.name}</p>
                                    <p className="text-xs text-neutral-500">{method.instructions}</p>
                                 </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                 ${selectedMethod === method.id ? 'border-blue-600' : 'border-neutral-300'}`}>
                                 {selectedMethod === method.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sticky top-24">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg">Ringkasan Pesanan</h3>
                     <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                        #{order.id_order}
                     </span>
                  </div>

                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                     {order.detail_order?.map((item: any) => (
                        <div key={item.id_detail_order} className="flex justify-between text-sm">
                           <div className="flex-1">
                              <p className="text-neutral-800 dark:text-neutral-200 font-medium">{item.masakan?.nama_masakan}</p>
                              <p className="text-xs text-neutral-500">x{item.jumlah}</p>
                           </div>
                           <p className="font-semibold">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                        </div>
                     ))}
                  </div>

                  <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Subtotal</span>
                        <span>Rp {order.total_harga.toLocaleString('id-ID')}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Tax & Service (0%)</span>
                        <span>Rp 0</span>
                     </div>
                     <div className="flex justify-between items-end pt-2">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-xl text-blue-600">Rp {order.total_harga.toLocaleString('id-ID')}</span>
                     </div>
                  </div>

                  <div className="mt-6">
                     <Button 
                        onClick={handlePayment} 
                        disabled={!selectedMethod || processing}
                        className="w-full py-4 text-base font-bold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700"
                     >
                        {processing ? 'Memproses...' : `Bayar Rp ${order.total_harga.toLocaleString('id-ID')}`}
                     </Button>
                     
                     <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Pembayaran Aman & Terenkripsi</span>
                     </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CustomerPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}