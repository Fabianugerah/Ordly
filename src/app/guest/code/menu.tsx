// src/app/customer/menu/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Utensils, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import Button from '@/components/ui/Button';

interface MenuItem {
  id_masakan: number;
  nama_masakan: string;
  harga: number;
  kategori: string;
  deskripsi: string;
  gambar?: string;
  status_masakan: string;
}

interface CartItem extends MenuItem {
  jumlah: number;
}

export default function GuestMenuPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [filteredMenu, setFilteredMenu] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    fetchMenu();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('guest_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Check if table number is provided in URL (from QR Code scan)
    const params = new URLSearchParams(window.location.search);
    const tableFromQR = params.get('table');
    if (tableFromQR) {
      // Save table number for later use in order
      localStorage.setItem('pre_selected_table', tableFromQR);
    }
  }, []);

  useEffect(() => {
    filterMenu();
  }, [menu, searchTerm, selectedCategory]);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('guest_cart', JSON.stringify(cart));
  }, [cart]);

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

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.id_masakan === item.id_masakan);
    if (existing) {
      setCart(cart.map(c => 
        c.id_masakan === item.id_masakan 
          ? { ...c, jumlah: c.jumlah + 1 }
          : c
      ));
    } else {
      setCart([...cart, { ...item, jumlah: 1 }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(c => c.id_masakan !== id));
    } else {
      setCart(cart.map(c => 
        c.id_masakan === id ? { ...c, jumlah: quantity } : c
      ));
    }
  };

  const getItemQuantity = (id: number) => {
    return cart.find(item => item.id_masakan === id)?.jumlah || 0;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }
    router.push('/guest/order');
  };

  const kategoriList = [
    { label: 'Semua', value: 'all' },
    { label: 'Makanan', value: 'makanan' },
    { label: 'Minuman', value: 'minuman' },
    { label: 'Dessert', value: 'dessert' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-neutral-900 dark:to-neutral-800 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/login')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                aria-label="Kembali"
              >
                <Home className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-orange-600">CaffeeIn</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pilih menu favorit Anda</p>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-700 transition-colors shadow-lg relative"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Keranjang</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
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

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
              {kategoriList.map((kat) => (
                <button
                  key={kat.value}
                  onClick={() => setSelectedCategory(kat.value)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === kat.value
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  {kat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        {filteredMenu.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl">
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
                  {/* Background Image */}
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
                        Rp {parseFloat(item.harga.toString()).toLocaleString('id-ID')}
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
                        onClick={() => addToCart(item)}
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Checkout Button (Mobile) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6 md:hidden z-50">
          <button
            onClick={handleCheckout}
            className="w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg shadow-2xl flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            Lihat Keranjang ({cart.length})
          </button>
        </div>
      )}
    </div>
  );
}