'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Search, ShoppingCart, Plus, Minus, Utensils, Star, X, ChevronRight, Home, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/NavbarCustomer';
import Footer from '@/components/layout/FooterCustomer';
import { MENU_CATEGORIES, SORT_OPTIONS } from '@/constants/options';

export default function CustomerMenuPage() {
  const router = useRouter();
  const { items, addItem, updateQuantity } = useCartStore();
  
  const [menu, setMenu] = useState<any[]>([]);
  const [filteredMenu, setFilteredMenu] = useState<any[]>([]);
  
  // State sorting
  const [sortBy, setSortBy] = useState<string>('relevancy');

  const MIN = 0;
  const MAX = 100000;

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 2. Gabungkan opsi 'Semua' dengan MENU_CATEGORIES yang di-import
  const categoryFilters = [
    ...MENU_CATEGORIES
  ];

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    filterMenu();
  }, [menu, searchTerm, selectedCategory, minPrice, maxPrice, sortBy]);

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
    let filtered = [...menu];

    // 1. Filter Search
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.nama_masakan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Filter Kategori
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (item) => item.kategori.toLowerCase() === selectedCategory
      );
    }

    // 3. Filter Range Harga
    filtered = filtered.filter(
      (item) => item.harga >= minPrice && item.harga <= maxPrice
    );

    // 4. Sorting
    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => Number(a.harga) - Number(b.harga));
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => Number(b.harga) - Number(a.harga));
    } else if (sortBy === 'relevancy') {
      // Sort berdasarkan urutan kategori dari MENU_CATEGORIES
      const categoryOrder = MENU_CATEGORIES.map(cat => cat.value);
      filtered.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.kategori.toLowerCase());
        const indexB = categoryOrder.indexOf(b.kategori.toLowerCase());
        
        // Jika kategori tidak ditemukan, taruh di akhir
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;
        
        return orderA - orderB;
      });
    }

    setFilteredMenu(filtered);
  };

  const getItemQuantity = (id_masakan: number) => {
    return items.find((item) => item.id_masakan === id_masakan)?.jumlah || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col text-neutral-900 dark:text-white transition-colors duration-300">
      <main className="flex-1">
        <Navbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 xl:px-0 pt-10 pb-10">

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 w-full justify-center font-medium"
            >
              <Filter className="w-4 h-4" />
              {showMobileFilter ? 'Tutup Filter' : 'Buka Filter'}
            </button>
          </div>

          {/* Sidebar Filter */}
          <aside className={`
            w-full lg:w-64 space-y-6 lg:space-y-8 lg:sticky lg:top-24 lg:self-start
            ${showMobileFilter ? 'block' : 'hidden lg:block'}
            bg-neutral-50 dark:bg-neutral-950 lg:bg-transparent
            ${showMobileFilter ? 'pb-6 border-b border-neutral-200 dark:border-neutral-800 mb-6' : ''}
          `}>
            {/* Search - Hidden on mobile (available in navbar) */}
            <div className="lg:block">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 text-2xl">Filter</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-transparent text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-500 transition-all placeholder:text-neutral-500"
                />
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 text-base lg:text-base">Harga</h3>
              <div className="relative w-full mt-6">
                <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full relative">
                  <div
                    className="absolute h-1 bg-neutral-800 dark:bg-neutral-300 rounded-full"
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
                  className="w-full bg-neutral-50 dark:bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
                  placeholder="From"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
                  placeholder="To"
                />
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                Rp {minPrice.toLocaleString('id-ID')} – Rp {maxPrice.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800"></div>

            {/* Category Filter */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 text-base lg:text-base">Kategori</h3>
              <div className="flex flex-col gap-3">
                {categoryFilters.map((kat) => {
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
                            ? 'bg-neutral-900 dark:bg-neutral-200 border-neutral-900 dark:border-neutral-200'
                            : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                        }`}
                      >
                        {checked && (
                          <svg
                            className="w-3.5 h-3.5 text-white dark:text-black"
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
                          checked 
                            ? 'text-neutral-900 dark:text-white font-medium' 
                            : 'text-neutral-500 dark:text-neutral-400'
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
          <main className="flex-1 min-w-0">
            <div className="flex flex-col gap-4 lg:gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span className="text-neutral-900 dark:text-white font-medium">Menu</span>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white">Daftar Menu</h1>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 lg:gap-8 w-full">
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Ditemukan {filteredMenu.length} menu
                </p>
                <div className="flex items-center gap-3 lg:gap-4 w-full sm:w-auto">
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm whitespace-nowrap">Urutkan</p>
                  <div className="w-full sm:w-44">
                    <Select
                      options={[...SORT_OPTIONS]} 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm my-6">
                {(minPrice !== MIN || maxPrice !== MAX) && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm">
                    Price: Rp {minPrice.toLocaleString('id-ID')} – Rp {maxPrice.toLocaleString('id-ID')}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300"
                      onClick={() => {
                        setMinPrice(MIN);
                        setMaxPrice(MAX);
                      }}
                    />
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm">
                    Kategori: {selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer items-center hover:text-neutral-600 dark:hover:text-neutral-300"
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
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline ml-2 text-xs sm:text-sm"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {filteredMenu.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                <p className="text-neutral-400 font-medium">Menu tidak ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-y-16 sm:gap-y-20 gap-x-4 sm:gap-x-6 lg:gap-x-8 mt-12 sm:mt-16">
                {filteredMenu.map((item) => {
                  const quantity = getItemQuantity(item.id_masakan);

                  return (
                    <div
                      key={item.id_masakan}
                      className="bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-2 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 rounded-2xl p-4 sm:p-6 pt-24 sm:pt-28 shadow-md dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all duration-300 group relative"
                    >
                      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-1 px-2 py-1 rounded-full z-10 bg-transparent border border-neutral-200 dark:border-neutral-800">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">4.8/5</span>
                      </div>

                      <div className="absolute -top-12 sm:-top-14 left-2 transition-all duration-300">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-xl overflow-hidden group-hover:scale-105 transition-all duration-300">
                          {item.gambar ? (
                            <img
                              src={item.gambar}
                              alt={item.nama_masakan}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-300 dark:text-neutral-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 mb-4 sm:mb-6">
                        <h3 className="font-semibold text-neutral-900 dark:text-white text-base sm:text-lg line-clamp-1">
                          {item.nama_masakan}
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm line-clamp-2">
                          {item.deskripsi || 'Deskripsi tidak tersedia'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        {quantity === 0 ? (
                          <button
                            onClick={() => addItem(item)}
                            className="py-2 px-3 sm:px-4 bg-transparent group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 transition-all duration-300 shadow-sm active:scale-90 flex items-center gap-1 text-xs sm:text-sm font-medium"
                          >
                            Add <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center bg-neutral-900 dark:bg-neutral-100 rounded-lg p-1 border border-neutral-200 dark:border-transparent">
                            <button
                              onClick={() => updateQuantity(item.id_masakan, quantity - 1)}
                              className="p-1 sm:p-1.5 transition-colors"
                            >
                              <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-100 dark:text-neutral-900 hover:text-neutral-400 dark:hover:text-neutral-500" />
                            </button>
                            <span className="w-5 sm:w-6 text-center font-bold text-sm sm:text-base text-white dark:text-neutral-900">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id_masakan, quantity + 1)}
                              className="p-1 sm:p-1.5 transition-colors"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-100 dark:text-neutral-900 hover:text-neutral-400 dark:hover:text-neutral-500" />
                            </button>
                          </div>
                        )}
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                            Rp {(item.harga * 1.2).toLocaleString('id-ID')}
                          </span>
                          <span className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white">
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

      <Footer />
    </div>
  );
}