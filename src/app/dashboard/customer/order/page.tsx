// src/app/dashboard/customer/order/page.tsx (UPDATED)
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Trash2, ShoppingCart, Plus, Minus, ArrowLeft, Users, Check, RefreshCw } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Table {
  id_meja?: number;
  no_meja: string;
  kapasitas: number;
  status: 'tersedia' | 'terisi';
}

export default function CustomerOrderPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const user = useAuthStore((state) => state.user);
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
      
      const { data: allTables, error: tablesError } = await supabase
        .from('meja')
        .select('*')
        .order('no_meja');

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
    if (!selectedTable.trim()) {
      setError('Nomor meja harus dipilih!');
      return;
    }

    if (items.length === 0) {
      setError('Keranjang masih kosong! Silakan tambah menu terlebih dahulu.');
      return;
    }

    if (!user?.id_user) {
      setError('User tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        no_meja: selectedTable.trim(),
        tanggal: new Date().toISOString().split('T')[0],
        id_user: user.id_user,
        keterangan: keterangan.trim() || null,
        status_order: 'pending',
        total_harga: getTotalPrice(),
      };

      const { data: order, error: orderError } = await supabase
        .from('order')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        throw new Error('Gagal membuat pesanan: ' + orderError.message);
      }

      if (!order) {
        throw new Error('Gagal membuat pesanan: Data order tidak ditemukan');
      }

      const detailOrders = items.map((item) => ({
        id_order: order.id_order,
        id_masakan: item.id_masakan,
        jumlah: item.jumlah,
        harga_satuan: item.harga,
        subtotal: item.harga * item.jumlah,
        keterangan: item.keterangan || null,
        status_detail_order: 'pending',
      }));

      const { error: detailError } = await supabase
        .from('detail_order')
        .insert(detailOrders);

      if (detailError) {
        console.error('Detail order error:', detailError);
        await supabase.from('order').delete().eq('id_order', order.id_order);
        throw new Error('Gagal menyimpan detail pesanan: ' + detailError.message);
      }

      clearCart();
      
      // UPDATED: Redirect to payment page instead of orders
      router.push(`/dashboard/customer/payment?order=${order.id_order}`);
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.message || 'Terjadi kesalahan saat membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const getTableStyle = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-orange-500 text-white border-orange-600 shadow-lg scale-105';
    }
    if (status === 'terisi') {
      return 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300 dark:border-gray-600';
    }
    return 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-orange-500 hover:shadow-md cursor-pointer';
  };

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/customer/menu')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Buat Pesanan</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Pilih meja dan konfirmasi pesanan Anda</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/dashboard/customer/menu')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Menu
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pilih Nomor Meja</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={fetchTables}
                    disabled={loadingTables}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Refresh status meja"
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loadingTables ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">Tersedia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Dipilih</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                      <span className="text-gray-600 dark:text-gray-400">Terisi</span>
                    </div>
                  </div>
                </div>
              </div>

              {loadingTables ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
                    {tables.map((table) => {
                      const isSelected = selectedTable === table.no_meja;
                      const isAvailable = table.status === 'tersedia';
                      
                      return (
                        <button
                          key={table.no_meja}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedTable(table.no_meja);
                              setError('');
                            }
                          }}
                          disabled={!isAvailable}
                          className={`
                            relative aspect-square rounded-xl border-2 
                            transition-all duration-200 flex flex-col items-center justify-center
                            ${getTableStyle(table.status, isSelected)}
                          `}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          
                          <Users className={`w-6 h-6 mb-1 ${
                            isSelected ? 'text-white' : 
                            table.status === 'terisi' ? 'text-gray-400 dark:text-gray-500' : 
                            'text-gray-500 dark:text-gray-400'
                          }`} />
                          
                          <span className="text-lg font-bold">{table.no_meja}</span>
                          <span className="text-[10px] opacity-75">
                            {table.kapasitas} orang
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTable && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-sm text-orange-800 dark:text-orange-300">
                        ✓ Meja <strong>#{selectedTable}</strong> dipilih - Kapasitas {tables.find(t => t.no_meja === selectedTable)?.kapasitas} orang
                      </p>
                    </div>
                  )}
                </>
              )}
            </Card>

            <Card title={`Keranjang Belanja (${items.length} item)`}>
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Keranjang Anda masih kosong</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                    Silakan tambah menu dari daftar menu
                  </p>
                  <Button onClick={() => router.push('/dashboard/customer/menu')}>
                    Lihat Menu
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id_masakan}
                      className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                        🍽️
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                          {item.nama_masakan}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Rp {parseFloat(item.harga.toString()).toLocaleString('id-ID')} / porsi
                        </p>
                        {item.kategori && (
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {item.kategori}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id_masakan, item.jumlah - 1)}
                            disabled={loading}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-bold text-lg text-gray-800 dark:text-white">
                            {item.jumlah}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => updateQuantity(item.id_masakan, item.jumlah + 1)}
                            disabled={loading}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Subtotal</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-gray-800 dark:text-white text-lg">
                          Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}
                        </p>
                        <button
                          onClick={() => removeItem(item.id_masakan)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm('Yakin ingin mengosongkan keranjang?')) {
                          clearCart();
                        }
                      }}
                      disabled={loading}
                      className="w-full text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Kosongkan Keranjang
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card title="Detail Pesanan">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nomor Meja <span className="text-red-500">*</span></p>
                  {selectedTable ? (
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-orange-600">Meja #{selectedTable}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({tables.find(t => t.no_meja === selectedTable)?.kapasitas} orang)
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Silakan pilih meja di atas</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Pedas sedang, tanpa bawang..."
                    rows={3}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-800 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Jumlah Item</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {items.reduce((sum, item) => sum + item.jumlah, 0)} porsi
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      Rp {getTotalPrice().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span className="text-gray-600 dark:text-gray-400">Pajak & Service</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span className="text-gray-800 dark:text-white">Total Pembayaran</span>
                    <span className="text-primary">
                      Rp {getTotalPrice().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={loading || items.length === 0 || !selectedTable}
                  className="w-full py-3 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Lanjut ke Pembayaran</span>
                    </div>
                  )}
                </Button>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    💡 <strong>Info:</strong> Setelah konfirmasi, Anda akan diarahkan ke halaman pembayaran untuk menyelesaikan transaksi.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}