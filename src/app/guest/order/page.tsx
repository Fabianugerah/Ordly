// src/app/guest/order/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ShoppingCart, Plus, Minus, ArrowLeft, Users, Check, RefreshCw, Utensils, X, User, AlertCircle } from 'lucide-react';
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
  // Ambil customerName dan setCustomerName dari store
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, customerName, setCustomerName } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [error, setError] = useState('');
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

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
    // Validasi Nama
    if (!customerName.trim()) {
      setError('Mohon masukkan Nama Anda terlebih dahulu!');
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas
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
        nama_pelanggan: customerName.trim(), // <--- KIRIM NAMA KE DB
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: keterangan.trim() || null,
        status_order: 'pending',
        total_harga: getTotalPrice(),
        id_user: guestUser.id_user,
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

      // Jangan clearCart() disini, biarkan payment page yang menghandle atau clear setelah bayar
      // Tapi karena logic sebelumnya clearCart(), kita ikuti flow yang ada namun simpan nama di state

      // clearCart(); <--- Hapus ini agar nama & item tetap ada jika user back (opsional)
      // Tapi flow Anda sebelumnya clearCart(), jadi pastikan nama tersimpan di DB.

      router.push(`/guest/payment?order=${order.id_order}`);

    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const getTableStyle = (status: string, isSelected: boolean) => {
    if (isSelected) return 'bg-white text-black border-white shadow-lg scale-105';
    if (status === 'terisi') return 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 cursor-not-allowed';
    return 'bg-white dark:bg-neutral-800 hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-500 hover:shadow-md cursor-pointer';
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <main className="flex-1 px-4 md:px-8 py-8 space-y-8">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/guest/menu')} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-neutral-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Buat Pesanan</h1>
                <p className="text-neutral-400 mt-1">Lengkapi data pemesan & pilih meja</p>
              </div>
            </div>
            <Button onClick={() => router.push('/guest/menu')} variant="outline" className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Tambah Menu
            </Button>
          </div>

          <div className="mb-8">
            <PaymentSteps currentStep={1} />
          </div>

          {error && (
            <div className="flex flex-row gap-2 items-center bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <AlertCircle className="text-red-400"/>
              <p className="text-red-400 text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Input Nama */}
              <Card>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-neutral-600/30 flex items-center justify-center text-neutral-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Data Pemesan</h2>
                      <p className="text-sm text-neutral-400">Isi data pemesan sebelum melanjutkan</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white mb-2">
                      Nama Pelanggan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama Anda..."
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 text-neutral-900 dark:text-white placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Pilih Meja */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-neutral-800 dark:text-white">Pilih Nomor Meja <span className="text-red-500">*</span></h2> 
                  <button onClick={fetchTables} disabled={loadingTables} className="p-2 hover:bg-neutral-800 rounded-lg">
                    <RefreshCw className={`w-5 h-5 text-neutral-400 ${loadingTables ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingTables ? (
                  <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-neutral-500 border-t-transparent rounded-full"></div></div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
                      {tables.map((table) => (
                        <button
                          key={table.no_meja}
                          onClick={() => table.status === 'tersedia' && setSelectedTable(table.no_meja)}
                          disabled={table.status !== 'tersedia'}
                          className={`relative aspect-square rounded-xl border-2 border-neutral-700 transition-all duration-200 flex flex-col items-center justify-center ${getTableStyle(table.status, selectedTable === table.no_meja)}`}
                        >
                          {selectedTable === table.no_meja && <div className="absolute top-1 right-1 bg-black rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>}
                          <Users className="w-6 h-6 mb-1 opacity-80" />
                          <span className="text-lg font-bold">{table.no_meja}</span>
                          <span className="text-[10px] opacity-75">{table.kapasitas} orang</span>
                        </button>
                      ))}
                    </div>
                    {selectedTable && (
                      <div className="flex gap-2 p-3 items-center bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm font-base">
                         <div className="border border-green-400 rounded-full p-1"><Check className="w-3 h-3 text-green-400" /></div>
                         <p>Meja #{selectedTable} Dipilih</p>
                      </div>
                    )}
                  </>
                )}
              </Card>

              {/* Keranjang Belanja */}
              <Card title={`Keranjang Belanja (${items.length} item)`}>
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                    <p className="text-white mb-2">Keranjang Anda masih kosong</p>
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
                        className="flex items-start gap-4 p-4 border-b border-neutral-800 hover:shadow-md transition-shadow"
                      >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-2xl">
                          {item.gambar ? (
                            <img
                              src={item.gambar}
                              alt={item.nama_masakan}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                              <Utensils className="w-12 h-12 text-neutral-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-lg">
                            {item.nama_masakan}
                          </h3>
                          <p className="text-sm text-neutral-400 mb-4">
                            Rp {parseFloat(item.harga.toString()).toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center">
                            <div className="flex bg-transparent border border-neutral-800 rounded-xl p-1">
                              <button
                                className="p-1 hover:bg-neutral-800 rounded-lg transition-colors text-white"
                                onClick={() => updateQuantity(item.id_masakan, item.jumlah - 1)}
                                disabled={loading}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-bold text-lg text-white">
                                {item.jumlah}
                              </span>
                              <button
                                className="p-1 hover:bg-neutral-800 rounded-lg transition-colors text-white"
                                onClick={() => updateQuantity(item.id_masakan, item.jumlah + 1)}
                                disabled={loading}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <button
                            onClick={() => removeItem(item.id_masakan)}
                            disabled={loading}
                            className="text-neutral-400 p-2 hover:bg-neutral-800 rounded-lg transition-colors mb-8"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <p className="font-bold text-white text-lg">
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
            <div>
              <Card title="Ringkasan">
                <div className="space-y-4">
                  {/* Tampilkan Nama di Ringkasan */}
                  <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Nama Pelanggan</span>
                      <span className="text-white text-base font-bold">{customerName || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-neutral-400">Meja</span>
                      <div className="border border-neutral-700 rounded-lg px-2 py-1 bg-neutral-800 text-sm">
                      <span className="text-white font-bold">{selectedTable ? `#${selectedTable}` : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-neutral-400 mb-2 block">Catatan (Opsional)</label>
                    <textarea
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      rows={6}
                      placeholder="Contoh: Jangan terlalu pedas..."
                    />
                  </div>

                  <div className="border-t border-neutral-800 pt-4 space-y-2">
                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>Total</span>
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