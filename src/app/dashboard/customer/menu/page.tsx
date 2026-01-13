'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { Search, ShoppingCart, Plus, Minus, Utensils, Image } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';

export default function CustomerMenuPage() {
  const router = useRouter();
  const { items, addItem, updateQuantity } = useCartStore();
  const [menu, setMenu] = useState<any[]>([]);
  const [filteredMenu, setFilteredMenu] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    filterMenu();
  }, [menu, searchTerm, selectedCategory]);


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

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.nama_masakan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (item) => item.kategori.toLowerCase() === selectedCategory
      );
    }

    setFilteredMenu(filtered);
  };


  const getItemQuantity = (id_masakan: number) => {
    return items.find((item) => item.id_masakan === id_masakan)?.jumlah || 0;
  };

  const kategoriList = [
    { label: 'Semua', value: 'all' },
    { label: 'Makanan', value: 'makanan' },
    { label: 'Minuman', value: 'minuman' },
    { label: 'Dessert', value: 'dessert' },
  ];


  if (loading) {
    return (
      <DashboardLayout allowedRoles={['customer']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Menu Makanan</h1>
            <p className="text-gray-600 mt-1">Pilih menu favorit Anda</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/customer/order')}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Keranjang ({items.length})
          </Button>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}

                className="w-full pl-12 pr-4 py-3 bg-transparent dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {kategoriList.map((kat) => (
                <button
                  key={kat.value}
                  onClick={() => setSelectedCategory(kat.value)}

                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${selectedCategory === kat.value

                    ? 'bg-neutral-800 text-white shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-800'
                    }`}
                >
                  {kat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid - Beautiful Cards */}
        {filteredMenu.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">Tidak ada menu ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenu.map((item) => {
              const quantity = getItemQuantity(item.id_masakan);
              return (
                <div
                  key={item.id_masakan}
                  className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-2xl group transition-all duration-500 hover:-translate-y-2"
                >
                  {/* Background Image Layer */}
                  <div className="absolute inset-0 z-0">
                    {item.gambar ? (
                      <img
                        src={item.gambar}
                        alt={item.nama_masakan}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                        <Utensils className="w-20 h-20 text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Content Layer */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-end p-4">

                    {/* Title & Price */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md max-w-[70%]">
                        {item.nama_masakan}
                      </h3>
                      <span className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl text-white font-bold text-xs">
                        Rp {parseFloat(item.harga).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Description */}
                    {item.deskripsi && (
                      <p className="text-gray-300 text-sm line-clamp-2 mb-4 drop-shadow-sm">
                        {item.deskripsi}
                      </p>
                    )}

                    {/* Category Badge */}
                    <div className="flex gap-2 mb-6">
                      <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                        {item.kategori}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => addItem(item)}
                        className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah ke Keranjang
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id_masakan, quantity - 1)}
                          className="flex-1 bg-white/90 hover:bg-white text-black font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center shadow-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-6 py-3 bg-white text-black font-bold rounded-2xl shadow-lg">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id_masakan, quantity + 1)}
                          className="flex-1 bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Decorative dots */}
                  <div className="absolute top-1/2 right-1/2 translate-x-1/2 z-20 flex gap-1 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}