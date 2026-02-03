'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { paymentService, PAYMENT_METHODS } from '@/lib/services/paymentService';
import PaymentSteps from '@/components/payment/PaymentSteps';
import Navbar from '@/components/layout/NavbarCustomer';
import Footer from '@/components/layout/FooterCustomer';

// KONFIGURASI PAJAK (10%)
const TAX_RATE = 0.10;

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  // 1. PERBAIKAN: Ambil fungsi clearCart dan setCustomerName dari store
  const { addItem, clearCart, setCustomerName } = useCartStore();

  const [order, setOrder] = useState<any>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk perhitungan harga
  const [priceDetails, setPriceDetails] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (orderId) {
      fetchOrderDetails(parseInt(orderId));
    } else {
      router.push('/guest/orders');
    }
  }, [searchParams]);

  // Hitung ulang pajak saat data order tersedia
  useEffect(() => {
    if (order) {
      const subtotal = order.total_harga || 0;
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax;

      setPriceDetails({
        subtotal,
        tax,
        total
      });
    }
  }, [order]);

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

      // Cek apakah sudah dibayar
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

  // --- LOGIKA BACK DIPERBAIKI DI SINI ---
  const handleBackToOrder = async () => {
    if (!order) return;

    if (!confirm('Kembali ke menu order? Pesanan saat ini akan dibatalkan agar Anda bisa mengubah menu.')) {
      return;
    }

    setCancelling(true);

    try {
      // A. [PENTING] BERSIHKAN KERANJANG DULU!
      // Ini mencegah item menjadi ganda (4 jadi 8)
      clearCart();

      // B. Kembalikan Nama Pelanggan ke Store
      if (order.nama_pelanggan) {
        setCustomerName(order.nama_pelanggan);
      }

      // C. Kembalikan item ke Keranjang
      if (order.detail_order) {
        order.detail_order.forEach((detail: any) => {
          const itemData = {
            id_masakan: detail.masakan.id_masakan,
            nama_masakan: detail.masakan.nama_masakan,
            harga: detail.harga_satuan,
            gambar: detail.masakan.gambar,
            kategori: detail.masakan.kategori,
            status_masakan: detail.masakan.status_masakan
          };

          // Masukkan item pertama
          addItem(itemData);

          // Masukkan sisa quantity (jika jumlah > 1)
          for (let i = 1; i < detail.jumlah; i++) {
            addItem(itemData);
          }
        });
      }

      // D. Hapus Order Pending dari DB (karena user mau buat ulang)
      const { error } = await supabase
        .from('order')
        .delete()
        .eq('id_order', order.id_order);

      if (error) throw error;

      // E. Redirect ke halaman Order
      router.push('/guest/order');

    } catch (error) {
      console.error("Gagal membatalkan pesanan:", error);
      alert("Gagal kembali ke menu order.");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethodId) {
      alert('Silakan pilih metode pembayaran');
      return;
    }

    const method = paymentService.getPaymentMethodById(selectedMethodId);
    if (!method) return;

    setProcessing(true);

    try {
      const response = await paymentService.createSelfPayment({
        id_order: order.id_order,
        id_user: user?.id_user!,
        total_bayar: priceDetails.total, // MENGGUNAKAN TOTAL + PAJAK
        metode_pembayaran: method.value,
        payment_details: {
          provider: selectedMethodId,
        },
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      setPaymentInfo(response.payment_info);

      // Refresh otomatis ke receipt setelah 5 detik (simulasi sukses)
      setTimeout(() => {
        router.push(`/guest/receipt?transaksi=${response.transaksi.id_transaksi}`);
      }, 15000);

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

  if (loading || cancelling) {
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
        {/* Header & Back Button */}
        <div className="sticky top-0 z-10 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
            <button
              onClick={handleBackToOrder}
              disabled={processing || cancelling}
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Back To Checkout</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          <PaymentSteps currentStep={2} />

          {paymentInfo ? (
            /* --- Payment Processing View (QR / VA) --- */
            <div className="max-w-md mx-auto mt-8 text-center animate-fade-in">
              <div className="mb-6">
                <Clock className="w-12 h-12 text-blue-500 mx-auto animate-pulse" />
                <h2 className="text-2xl font-bold mt-4">Selesaikan Pembayaran</h2>
                <p className="text-neutral-500 text-sm mt-1">Waktu tersisa: 14:59</p>
              </div>

              <Card className="p-6 border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10">
                {/* QR CODE */}
                {paymentInfo.qr_code && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-3 text-neutral-600 dark:text-neutral-300">Scan QR Code</p>
                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                      <Image src={paymentInfo.qr_code} alt="QR Code" width={200} height={200} className="mix-blend-multiply" />
                    </div>
                  </div>
                )}

                {/* VIRTUAL ACCOUNT */}
                {paymentInfo.virtual_account && (
                  <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left mb-4">
                    <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Nomor Pembayaran / VA</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-bold tracking-widest text-blue-600 dark:text-blue-400">
                        {paymentInfo.virtual_account}
                      </span>
                      <button onClick={() => copyToClipboard(paymentInfo.virtual_account)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-neutral-500" />}
                      </button>
                    </div>
                    {paymentInfo.account_name && (
                      <p className="text-xs text-neutral-400 mt-1">a.n {paymentInfo.account_name}</p>
                    )}
                  </div>
                )}

                <div className="text-xs text-neutral-500 mt-4 bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <p className="font-semibold mb-1">Total Tagihan:</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">Rp {priceDetails.total.toLocaleString('id-ID')}</p>
                </div>

                <p className="text-xs text-neutral-400 mt-4 animate-pulse">Halaman ini akan otomatis refresh setelah pembayaran berhasil...</p>
              </Card>
            </div>
          ) : (
            /* --- Selection View (Two Columns) --- */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">

              {/* Kolom Kiri: Pilihan Metode */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Pilih Metode Pembayaran
                </h2>

                {/* 1. QRIS */}
                <Card>
                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider pl-1">QRIS</p>
                    <div className="grid grid-cols-1">
                      {PAYMENT_METHODS.filter(m => m.type === 'qris').map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left group
                                    ${selectedMethodId === m.id
                              ? 'border-white bg-blue-50 dark:bg-white text-black'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-white bg-white dark:bg-neutral-900'
                            }`}
                        >
                          <div className="relative w-12 h-12 mb-1">
                            <Image src={m.icon} alt={m.name} fill className="object-contain rounded-lg" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{m.name}</p>
                            <p className="text-xs text-neutral-500">{m.instructions}</p>
                          </div>
                          {selectedMethodId === m.id && <div className="bg-black p-1 rounded-full flex items-center justify-center animate-scale-in"> <Check className="w-3 h-3 text-white" /> </div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. E-Wallet */}
                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider pl-1">E-Wallet</p>
                    <div className="grid grid-cols-3 gap-3">
                      {PAYMENT_METHODS.filter(m => m.type === 'ewallet').map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all h-32 relative
                                    ${selectedMethodId === m.id
                              ? 'border-white bg-blue-50 dark:bg-white text-black'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-white bg-white dark:bg-neutral-900'
                            }`}
                        >
                          {/* IMAGE ICON */}
                          <div className="relative w-12 h-12 mb-1">
                            <Image src={m.icon} alt={m.name} fill className="object-contain rounded-lg" />
                          </div>
                          <span className="text-xs font-semibold">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Bank Transfer */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider pl-1">Virtual Account</p>
                    <div className="space-y-3">
                      {PAYMENT_METHODS.filter(m => m.type === 'bank_transfer').map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                                    ${selectedMethodId === m.id
                              ? 'border-white bg-blue-50 dark:bg-white text-black'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-white bg-white dark:bg-neutral-900'
                            }`}
                        >
                          <div className="relative w-12 h-12 mb-1">
                            <Image src={m.icon} alt={m.name} fill className="object-contain rounded-lg" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{m.name}</p>
                          </div>
                          {selectedMethodId === m.id && <div className="bg-black p-1 rounded-full flex items-center justify-center animate-scale-in"> <Check className="w-3 h-3 text-white" /> </div>}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              
              {/* Kolom Kanan: Ringkasan Pembayaran (STYLE BARU) */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sticky top-24 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Ringkasan Pesanan</h3>
                    <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                      #{order.id_order}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6 pr-2 max-h-60 overflow-y-auto custom-scrollbar">
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

                  {/* Rincian Biaya (Dengan Pajak) */}
                  <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Subtotal</span>
                      <span>Rp {priceDetails.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Tax & Service (10%)</span>
                      <span>Rp {priceDetails.tax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-base">Total Bayar</span>
                      <span className="font-bold text-lg text-white">Rp {priceDetails.total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={handlePayment}
                      disabled={!selectedMethodId || processing}
                      className="w-full py-4 text-base font-bold bg-white hover:bg-neutral-100 text-neutral-900"
                    >
                      {processing ? 'Memproses...' : 'Bayar Sekarang'}
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