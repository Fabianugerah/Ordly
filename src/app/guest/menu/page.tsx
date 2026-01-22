'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { Search, ShoppingCart, Plus, Minus, Utensils, Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/NavbarCustomer';
import Footer from '@/components/layout/FooterCustomer';

export default function CustomerMenuPage() {
  const router = useRouter();
  const { items, addItem, updateQuantity } = useCartStore();
  const [menu, setMenu] = useState<any[]>([]);
  const [filteredMenu, setFilteredMenu] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'relevancy' | 'price_asc' | 'price_desc'>('relevancy');
  const MIN = 0;
  const MAX = 100000;

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    filterMenu();
  }, [menu, searchTerm, selectedCategory, minPrice, maxPrice]);

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

    if (sortBy === 'price_asc') {
      filtered = [...filtered].sort((a, b) => a.harga - b.harga);
    }

    if (sortBy === 'price_desc') {
      filtered = [...filtered].sort((a, b) => b.harga - a.harga);
    }

    filtered = filtered.filter(
      (item) => item.harga >= minPrice && item.harga <= maxPrice
    );

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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <main className="flex-1">
        {/* NAVBAR - Komponen Terpisah */}
        <Navbar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 mt-16">
          {/* Sidebar Filter (Desktop) */}
          <aside className="w-full md:w-64 space-y-8">
            <div>
              <h3 className="font-semibold text-neutral-800 dark:text-white mb-4 text-2xl">Filter</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-transparent text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Harga</h3>
              <div className="relative w-full mt-6">
                <div className="h-1 bg-neutral-700 rounded-full relative">
                  <div
                    className="absolute h-1 bg-neutral-300 rounded-full"
                    style={{
                      left: `${(minPrice / MAX) * 100}%`,
                      right: `${100 - (maxPrice / MAX) * 100}%`,
                    }}
                  />
                </div>

                <input
                  type="range"
                  min={MIN}
                  max={MAX}
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(Math.min(Number(e.target.value), maxPrice - 1000))
                  }
                  className="range-thumb"
                />

                <input
                  type="range"
                  min={MIN}
                  max={MAX}
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(Math.max(Number(e.target.value), minPrice + 1000))
                  }
                  className="range-thumb"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full bg-transparent border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="From"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full bg-transparent border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="To"
                />
              </div>

              <p className="text-xs text-neutral-400 mt-2">
                Rp {minPrice.toLocaleString('id-ID')} – Rp {maxPrice.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex-1 border-t border-neutral-800"></div>

            <div>
              <h3 className="font-semibold text-white mb-3">Kategori</h3>
              <div className="flex flex-col gap-3">
                {kategoriList.map((kat) => {
                  const checked = selectedCategory === kat.value;

                  return (
                    <label
                      key={kat.value}
                      className="flex items-center gap-3 cursor-pointer text-sm select-none"
                    >
                      <div
                        onClick={() => setSelectedCategory(kat.value)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                          checked
                            ? 'bg-neutral-200 border-neutral-200'
                            : 'border-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        {checked && (
                          <svg
                            className="w-3.5 h-3.5 text-black"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      <span
                        className={`transition-colors ${
                          checked ? 'text-white font-medium' : 'text-neutral-400'
                        }`}
                      >
                        {kat.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col gap-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-5xl font-semibold text-white">Daftar Menu</h1>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-neutral-400 text-sm mt-2">
                  Ditemukan {filteredMenu.length} menu
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-neutral-400 text-sm">Urutkan</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-neutral-900 border border-neutral-700 text-sm text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="relevancy">Relevancy</option>
                    <option value="price_asc">Harga Termurah</option>
                    <option value="price_desc">Harga Termahal</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm my-8">
                {(minPrice !== MIN || maxPrice !== MAX) && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-white rounded-lg">
                    Price: Rp {minPrice.toLocaleString('id-ID')} – Rp {maxPrice.toLocaleString('id-ID')}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        setMinPrice(MIN);
                        setMaxPrice(MAX);
                      }}
                    />
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-white rounded-lg">
                    Kategori: {selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer items-center"
                      onClick={() => setSelectedCategory('all')}
                    />
                  </span>
                )}

                {(selectedCategory !== 'all' || minPrice !== MIN || maxPrice !== MAX) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setMinPrice(MIN);
                      setMaxPrice(MAX);
                    }}
                    className="text-neutral-400 hover:text-white underline ml-2"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {filteredMenu.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-800">
                <p className="text-neutral-400 font-medium">Menu tidak ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-20 gap-x-8 mt-16">
                {filteredMenu.map((item) => {
                  const quantity = getItemQuantity(item.id_masakan);

                  return (
                    <div
                      key={item.id_masakan}
                      className="bg-white dark:bg-neutral-900 hover:bg-neutral-800 border-2 border-transparent hover:border-neutral-700 rounded-2xl p-6 pt-28 shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all duration-300 group relative "
                    >
                      <div className="absolute top-6 right-6 flex items-center gap-1 px-2 py-1 rounded-full z-10 shadow-sm">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-bold text-neutral-400">4.8/5</span>
                      </div>

                      <div className="absolute -top-14 left-6 transition-transform duration-500">
                        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden shadow-2xl">
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
                      </div>

                      <div className="space-y-1 mb-6">
                        <h3 className="font-semibold text-white text-lg line-clamp-1">
                          {item.nama_masakan}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        {quantity === 0 ? (
                          <button
                            onClick={() => addItem(item)}
                            className="py-2 px-4 bg-transparent group-hover:bg-neutral-700 text-white rounded-xl border-2 border-neutral-800 group-hover:border-neutral-700 transition-all duration-300 shadow-md active:scale-90 flex items-center gap-1 text-sm font-medium"
                          >
                            Add <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center bg-neutral-100 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(item.id_masakan, quantity - 1)}
                              className="p-1.5 hover:bg-white rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4 text-neutral-600" />
                            </button>
                            <span className="w-6 text-center font-bold text-neutral-800">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id_masakan, quantity + 1)}
                              className="p-1.5 hover:bg-white rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 text-neutral-600" />
                            </button>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs text-neutral-400 line-through">
                            Rp {(item.harga * 1.2).toLocaleString('id-ID')}
                          </span>
                          <span className="text-lg font-medium text-white">
                            Rp {parseFloat(item.harga).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </main>

      {/* FOOTER - Komponen Terpisah */}
      <Footer />
    </div>
  );
}