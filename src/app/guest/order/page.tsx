// src/app/guest/order/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Users, Check, AlertCircle, RefreshCw, Utensils, X, User, ShoppingBag, Clock, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import Navbar from '@/components/layout/NavbarCustomer';
import Footer from '@/components/layout/FooterCustomer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import PaymentSteps from '@/components/payment/PaymentSteps';

interface Table {
  id_meja?: number;
  no_meja: string;
  kapasitas: number;
  status: 'tersedia' | 'terisi';
}

export default function CustomerOrderPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice, customerName, setCustomerName } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [error, setError] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away'>('dine_in');

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (orderType === 'take_away') {
      setSelectedTable('take_away');
    } else {
      setSelectedTable('');
    }
  }, [orderType]);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const { data: allTables, error: tablesError } = await supabase.from('meja').select('*').order('no_meja');
      if (tablesError) throw tablesError;

      const { data: activeOrders, error: ordersError } = await supabase
        .from('order')
        .select('no_meja')
        .in('status_order', ['pending', 'diproses']);
      if (ordersError) throw ordersError;

      const occupiedTables = activeOrders?.map(order => order.no_meja) || [];
      const tablesWithStatus = allTables?.map(table => ({
        ...table,
        status: occupiedTables.includes(table.no_meja) ? 'terisi' : 'tersedia'
      })) || [];

      setTables(tablesWithStatus as Table[]);
    } catch (error: any) {
      console.error('Error fetching tables:', error);
      setTables(generateDefaultTables());
    } finally {
      setLoadingTables(false);
    }
  };

  const generateDefaultTables = (): Table[] => {
    const defaultTables: Table[] = [];
    for (let i = 1; i <= 12; i++) {
      defaultTables.push({
        no_meja: i.toString(),
        kapasitas: i <= 4 ? 2 : i <= 8 ? 4 : i <= 10 ? 6 : 8,
        status: 'tersedia'
      });
    }
    return defaultTables;
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      setError('Mohon masukkan Nama Anda terlebih dahulu!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!selectedTable.trim()) {
      setError('Nomor meja harus dipilih!');
      return;
    }

    if (items.length === 0) {
      setError('Keranjang masih kosong!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: guestUser, error: guestError } = await supabase
        .from('users')
        .select('id_user')
        .eq('username', 'customer')
        .single();

      if (guestError) {
        setError('User "Customer" belum dikonfigurasi.');
        setLoading(false);
        return;
      }

      const orderData = {
        no_meja: selectedTable.trim(),
        nama_pelanggan: customerName.trim(),
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: keterangan.trim() || null,
        status_order: 'pending',
        total_harga: getTotalPrice(),
        id_user: guestUser.id_user,
        tipe_pesanan: orderType,
      };

      const { data: order, error: orderError } = await supabase
        .from('order')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);
      if (!order) throw new Error('Gagal membuat pesanan');

      const detailOrders = items.map((item) => ({
        id_order: order.id_order,
        id_masakan: item.id_masakan,
        jumlah: item.jumlah,
        harga_satuan: item.harga,
        subtotal: item.harga * item.jumlah,
        keterangan: item.keterangan || null,
        status_detail_order: 'pending',
      }));

      const { error: detailError } = await supabase.from('detail_order').insert(detailOrders);

      if (detailError) {
        await supabase.from('order').delete().eq('id_order', order.id_order);
        throw new Error(detailError.message);
      }

      router.push(`/guest/payment?order=${order.id_order}`);

    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // Logic Style Meja (Updated for Light Mode)
  const getTableStyle = (status: string, isSelected: boolean) => {
    // Selected: Gelap solid di light mode, Putih solid di dark mode
    if (isSelected) return 'bg-neutral-900 text-white border-neutral-900 shadow-lg scale-105 dark:bg-white dark:text-black dark:border-white';
    
    // Occupied: Abu-abu muda di light, Abu-abu tua di dark
    if (status === 'terisi') return 'bg-neutral-100 text-neutral-400 border-none cursor-not-allowed dark:bg-neutral-600 dark:text-neutral-500';
    
    // Available: Putih/Outline di light, Transparan di dark
    return 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-md cursor-pointer dark:bg-transparent dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:border-neutral-500';
  };

  return (
    // Background utama: Abu sangat muda (neutral-50) untuk light mode, Hitam (neutral-950) untuk dark mode
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col transition-colors duration-300">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <main className="flex-1 px-4 md:px-8 py-8 space-y-8">
        <div className="max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-center gap-2 text-sm text-neutral-500">
                <Link href="/guest/menu" className="hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1">
                  Menu
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-900 dark:text-white font-medium">Order</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Checkout</h1>
                <p className="text-neutral-500 mt-1">Lengkapi data pemesan & pilih meja</p>
              </div>
            </div>
            <Button onClick={() => router.push('/guest/menu')} variant="primary" className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Tambah Menu
            </Button>
          </div>

          <div className="mb-8">
            <PaymentSteps currentStep={1} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex flex-row gap-2 items-center bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6 dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Card Data Pemesan & Meja */}
              <Card>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Data Pemesan</h2>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Isi data pemesan sebelum melanjutkan</p>
                    </div>
                  </div>
                  
                  {/* Input Nama */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-2">
                      Nama Pelanggan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama Anda..."
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-500 text-neutral-900 placeholder:text-neutral-400 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white dark:focus:ring-1"
                    />
                  </div>

                  {/* Pilihan Tipe Pesanan */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-3">
                      Tipe Pesanan <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tombol Dine In */}
                      <button
                        onClick={() => setOrderType('dine_in')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                          orderType === 'dine_in'
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black shadow-md'
                            : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:border-neutral-500'
                        }`}
                      >
                        <Utensils className="w-6 h-6" />
                        <span className="font-bold text-sm">Dine In</span>
                      </button>

                      {/* Tombol Take Away */}
                      <button
                        onClick={() => setOrderType('take_away')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                          orderType === 'take_away'
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black shadow-md'
                            : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:border-neutral-500'
                        }`}
                      >
                        <ShoppingBag className="w-6 h-6" />
                        <span className="font-bold text-sm">Take Away</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* LOGIKA TAMPILAN: Hanya Tampilkan Meja Jika 'dine_in' */}
                {orderType === 'dine_in' ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-bold text-neutral-800 dark:text-white">Pilih Nomor Meja <span className="text-red-500">*</span></h2>
                      <button onClick={fetchTables} disabled={loadingTables} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                        <RefreshCw className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 ${loadingTables ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {loadingTables ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-neutral-300 border-t-neutral-800 dark:border-neutral-500 dark:border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6  gap-3 mb-4">
                          {tables.map((table) => (
                            <button
                              key={table.no_meja}
                              onClick={() => table.status === 'tersedia' && setSelectedTable(table.no_meja)}
                              disabled={table.status !== 'tersedia'}
                              className={`relative aspect-square rounded-xl border transition-all duration-200 flex flex-col items-center justify-center ${getTableStyle(table.status, selectedTable === table.no_meja)}`}
                            >
                              {selectedTable === table.no_meja && (
                                <div className="absolute top-1 right-1 bg-white dark:bg-black rounded-full p-1 shadow-sm">
                                  <Check className="w-3 h-3 text-neutral-900 dark:text-white" />
                                </div>
                              )}
                              <Users className="w-6 h-6 mb-1 opacity-80" />
                              <span className="text-lg font-bold">{table.no_meja}</span>
                              <span className="text-[10px] opacity-75">{table.kapasitas} orang</span>
                            </button>
                          ))}
                        </div>
                        
                      </>
                    )}
                  </>
                ) : (
                  /* TAMPILAN JIKA TAKE AWAY */
                  <div className="mt-4 flex flex-col items-center justify-center py-8 border border-dashed border-neutral-300 bg-neutral-50 rounded-xl dark:border-neutral-800 dark:bg-neutral-900/30">
                    <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mb-3 dark:bg-neutral-800">
                      <Clock className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <h3 className="text-md font-bold text-neutral-900 dark:text-white">Pesanan Take Away</h3>
                    <p className="text-neutral-500 text-xs text-center max-w-[250px] mt-1">
                      Mohon tunggu di area antrian setelah pembayaran selesai.
                    </p>
                  </div>
                )}
              </Card>

              {/* Keranjang Belanja */}
              <Card title={`Keranjang Belanja (${items.length} item)`}>
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-neutral-300 mx-auto mb-4 dark:text-neutral-500" />
                    <p className="text-neutral-900 dark:text-white mb-2 font-medium">Keranjang Anda masih kosong</p>
                    <p className="text-sm text-neutral-500 mb-4">
                      Silakan tambah menu dari daftar menu
                    </p>
                    <Button onClick={() => router.push('/guest/menu')}>
                      Lihat Menu
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id_masakan}
                        className="flex items-start gap-4 p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden">
                          {item.gambar ? (
                            <img
                              src={item.gambar}
                              alt={item.nama_masakan}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center dark:bg-neutral-800">
                              <Utensils className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-neutral-900 dark:text-white text-lg">
                            {item.nama_masakan}
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                            Rp {parseFloat(item.harga.toString()).toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center">
                            <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1 dark:bg-transparent dark:border-neutral-800">
                              <button
                                className="p-1 hover:bg-neutral-100 rounded-md transition-colors text-neutral-600 dark:text-white dark:hover:bg-neutral-700"
                                onClick={() => updateQuantity(item.id_masakan, item.jumlah - 1)}
                                disabled={loading}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center font-bold text-sm text-neutral-900 dark:text-white">
                                {item.jumlah}
                              </span>
                              <button
                                className="p-1 hover:bg-neutral-100 rounded-md transition-colors text-neutral-600 dark:text-white dark:hover:bg-neutral-700"
                                onClick={() => updateQuantity(item.id_masakan, item.jumlah + 1)}
                                disabled={loading}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between h-24">
                          <button
                            onClick={() => removeItem(item.id_masakan)}
                            disabled={loading}
                            className="text-neutral-400 p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors dark:hover:bg-neutral-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <p className="font-bold text-neutral-900 dark:text-white text-lg">
                            Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Detail Pesanan (Sticky Right) */}
            <div className="sticky top-20 lg:top-24 self-start">
              <Card title="Ringkasan">
                <div className="space-y-4">
                  {/* Tampilkan Nama di Ringkasan */}
                  <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Nama Pelanggan</span>
                      <span className="text-neutral-900 dark:text-white text-base font-bold">{customerName || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-neutral-500 dark:text-neutral-400">Tipe / Meja</span>
                      <div className="border border-neutral-200 rounded-lg px-2 py-1 bg-neutral-50 text-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <span className="text-neutral-900 dark:text-white font-bold">
                            {orderType === 'take_away' ? 'Take Away' : selectedTable ? `#${selectedTable}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 block">Catatan (Opsional)</label>
                    <textarea
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm text-neutral-900 focus:ring-2 focus:ring-neutral-500 focus:outline-none dark:bg-neutral-900 dark:border-neutral-800 dark:text-white dark:focus:ring-1"
                      rows={6}
                      placeholder="Contoh: Jangan terlalu pedas..."
                    />
                  </div>

                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-2">
                    <div className="flex justify-between text-neutral-900 dark:text-white font-bold text-lg">
                      <span className="font-semibold">Total</span>
                      <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <Button onClick={handleSubmitOrder} disabled={loading || items.length === 0} className="w-full py-3">
                    {loading ? 'Memproses...' : 'Lanjut Pembayaran'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}