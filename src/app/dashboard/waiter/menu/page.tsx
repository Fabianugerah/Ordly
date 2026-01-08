'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, ShoppingCart, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';

export default function WaiterMenuPage() {
  const router = useRouter();
  const { items, addItem, updateQuantity } = useCartStore();
  const [menu, setMenu] = useState<any[]>([]);
  const [filteredMenu, setFilteredMenu] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    filterMenu();
  }, [search, kategori, menu]);

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('masakan')
        .select('*')
        .eq('status_masakan', 'tersedia')
        .order('nama_masakan');

      if (!error && data) {
        setMenu(data);
        setFilteredMenu(data);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMenu = () => {
    let filtered = menu;

    if (search) {
      filtered = filtered.filter((item) =>
        item.nama_masakan.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (kategori !== 'Semua') {
      filtered = filtered.filter((item) => item.kategori === kategori);
    }

    setFilteredMenu(filtered);
  };

  const getItemQuantity = (id_masakan: number) => {
    return items.find((item) => item.id_masakan === id_masakan)?.jumlah || 0;
  };

  const kategoriList = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Dessert'];

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['waiter']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['waiter']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Menu Makanan</h1>
            <p className="text-gray-600 mt-1">Pilih menu untuk pelanggan</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/waiter/order')}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Keranjang ({items.length})
          </Button>
        </div>

        {/* Filter */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {kategoriList.map((kat) => (
                <button
                  key={kat}
                  onClick={() => setKategori(kat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    kategori === kat
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Menu Grid */}
        {filteredMenu.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">Tidak ada menu ditemukan</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map((item) => {
              const quantity = getItemQuantity(item.id_masakan);
              return (
                <Card key={item.id_masakan} className="hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {item.nama_masakan}
                  </h3>
                  {item.kategori && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                      {item.kategori}
                    </span>
                  )}
                  {item.deskripsi && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.deskripsi}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-primary mb-4">
                    Rp {parseFloat(item.harga).toLocaleString('id-ID')}
                  </p>

                  {quantity === 0 ? (
                    <Button
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah ke Keranjang
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => updateQuantity(item.id_masakan, quantity - 1)}
                        className="flex-1"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-xl font-bold text-gray-800 min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        onClick={() => updateQuantity(item.id_masakan, quantity + 1)}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}