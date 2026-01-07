'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Trash2, ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CustomerOrderPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const [noMeja, setNoMeja] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitOrder = async () => {
    // Validation
    if (!noMeja.trim()) {
      setError('Nomor meja harus diisi!');
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
      // 1. Insert order
      const orderData = {
        no_meja: noMeja.trim(),
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

      // 2. Insert detail orders
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
        // Rollback: delete the order
        await supabase.from('order').delete().eq('id_order', order.id_order);
        throw new Error('Gagal menyimpan detail pesanan: ' + detailError.message);
      }

      // 3. Success - Clear cart and redirect
      clearCart();
      alert(`Pesanan berhasil dibuat!\n\nNomor Pesanan: #${order.id_order}\nMeja: ${noMeja}\nTotal: Rp ${getTotalPrice().toLocaleString('id-ID')}`);
      router.push('/dashboard/customer/orders');
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.message || 'Terjadi kesalahan saat membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = (id_masakan: number, note: string) => {
    // Update item note in cart store
    const updatedItems = items.map((item) =>
      item.id_masakan === id_masakan ? { ...item, keterangan: note } : item
    );
    // Note: You might need to add updateKeterangan method to cartStore
  };

  return (
    <DashboardLayout allowedRoles={['pelanggan']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/customer/menu')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Buat Pesanan</h1>
              <p className="text-gray-600 mt-1">Review dan konfirmasi pesanan Anda</p>
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card title={`Keranjang Belanja (${items.length} item)`}>
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Keranjang Anda masih kosong</p>
                  <p className="text-sm text-gray-400 mb-6">
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
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                        🍽️
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-lg">
                          {item.nama_masakan}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Rp {parseFloat(item.harga.toString()).toLocaleString('id-ID')} / porsi
                        </p>
                        {item.kategori && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {item.kategori}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
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
                          <span className="w-12 text-center font-bold text-lg">
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
                        <p className="text-sm text-gray-500">Subtotal</p>
                      </div>

                      {/* Price & Delete */}
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-gray-800 text-lg">
                          Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}
                        </p>
                        <button
                          onClick={() => removeItem(item.id_masakan)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Clear Cart Button */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm('Yakin ingin mengosongkan keranjang?')) {
                          clearCart();
                        }
                      }}
                      disabled={loading}
                      className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Kosongkan Keranjang
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card title="Detail Pesanan">
              <div className="space-y-4">
                {/* Table Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Meja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={noMeja}
                    onChange={(e) => {
                      setNoMeja(e.target.value);
                      setError('');
                    }}
                    placeholder="Contoh: 5"
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan nomor meja tempat Anda duduk
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Pedas sedang, tanpa bawang..."
                    rows={3}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 resize-none"
                  />
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jumlah Item</span>
                    <span className="font-semibold">
                      {items.reduce((sum, item) => sum + item.jumlah, 0)} porsi
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      Rp {getTotalPrice().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-gray-600">Pajak & Service</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                    <span>Total Pembayaran</span>
                    <span className="text-primary">
                      Rp {getTotalPrice().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitOrder}
                  disabled={loading || items.length === 0}
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
                      <span>Buat Pesanan</span>
                    </div>
                  )}
                </Button>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Info:</strong> Pesanan akan dikirim ke dapur setelah konfirmasi.
                    Status pesanan dapat dilihat di menu &quot;Pesanan Saya&quot;.
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