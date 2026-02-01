// src/app/guest/receipt/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
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
      router.push('/guest/orders');
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!transaksi) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Navbar */}
      <div className="print:hidden">
         <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center pt-12 relative">
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <div className="w-full max-w-5xl mx-auto space-y-8">
          
          {/* Step 3: Confirmation */}
          <div className="print:hidden">
            <PaymentSteps currentStep={3} />
          </div>

          {/* Judul Halaman */}
          <div className="text-center space-y-2 mb-8 print:hidden animate-fade-in-down">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent text-white">
              Pembayaran Berhasil!
            </h1>
            <p className="text-neutral-400">
              Terima kasih telah memesan. Pesanan Anda sedang disiapkan.
            </p>
          </div>

          {/* Komponen Struk Digital */}
          <div className="animate-scale-in flex justify-center">
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  );
}