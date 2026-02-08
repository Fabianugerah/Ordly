// src/app/guest/receipt/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { Check } from 'lucide-react';
import DigitalReceipt from '@/components/payment/DigitalReceipt';
import PaymentSteps from '@/components/payment/PaymentSteps';
import Navbar from '@/components/layout/NavbarCustomer';
import Footer from '@/components/layout/FooterCustomer';

function ReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transaksi, setTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 2. Ambil fungsi clearCart dari store
  const clearCart = useCartStore((state) => state.clearCart);

  // State dummy untuk Navbar props
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const transaksiId = searchParams.get('transaksi');
    if (transaksiId) {
      fetchTransaksi(parseInt(transaksiId));
    } else {
      router.push('/guest/order');
    }
  }, [searchParams]);

  const fetchTransaksi = async (transaksiId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi')
        .select(`
          *,
          order:id_order(
            id_order,
            no_meja,
            nama_pelanggan,
            tipe_pesanan,
            detail_order(
              *,
              masakan(nama_masakan)
            )
          )
        `)
        .eq('id_transaksi', transaksiId)
        .single();

      if (error) throw error;

      setTransaksi(data);

      // 3. LOGIKA PENTING:
      // Jika data transaksi berhasil ditemukan (artinya pembayaran sukses),
      // maka kita KOSONGKAN keranjang belanja agar user bisa pesan baru lagi.
      clearCart();

    } catch (error) {
      console.error('Error fetching receipt:', error);
      alert('Gagal memuat struk pembayaran');
      router.push('/guest/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-300 dark:border-neutral-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!transaksi) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <div className="print:hidden">
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center pt-12 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 pb-10 relative">
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-green-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] lg:blur-[120px] -z-10 pointer-events-none"></div>

        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">

          {/* Step 3: Confirmation */}
          <div className="print:hidden px-4 sm:px-0">
            <PaymentSteps currentStep={3} />
          </div>

          {/* Judul Halaman */}
          <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8 print:hidden animate-fade-in-down px-4 sm:px-0">

            <div className="mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
              <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white stroke-[3]" />
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white">
              Pembayaran Berhasil!
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Terima kasih telah memesan. Pesanan Anda sedang disiapkan.
            </p>
          </div>

          {/* Komponen Struk Digital */}
          <div className="animate-scale-in flex justify-center px-4 sm:px-0">
            <DigitalReceipt
              transaksi={transaksi}
              onClose={() => router.push('/guest/menu')}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-300 dark:border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  );
}