// src/app/dashboard/customer/receipt/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DigitalReceipt from '@/components/payment/DigitalReceipt';

export default function ReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transaksi, setTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const transaksiId = searchParams.get('transaksi');
    if (transaksiId) {
      fetchTransaksi(parseInt(transaksiId));
    } else {
      router.push('/dashboard/customer/orders');
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
    } catch (error) {
      console.error('Error fetching receipt:', error);
      alert('Gagal memuat struk pembayaran');
      router.push('/dashboard/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!transaksi) {
    return null;
  }

  return (
    <DigitalReceipt
      transaksi={transaksi}
      onClose={() => router.push('/dashboard/customer')}
    />
  );
}