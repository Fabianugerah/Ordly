'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import MenuCard from '@/components/ui/MenuCard';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { Plus, Search } from 'lucide-react';

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);

  const [formData, setFormData] = useState({
    nama_masakan: '',
    harga: '',
    status_masakan: 'tersedia',
    kategori: 'makanan',
    deskripsi: '',
    gambar: '',
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    filterMenus();
  }, [menus, searchTerm, selectedCategory]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('masakan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Error fetching menus:', error);
      alert('Gagal memuat data menu');
    } finally {
      setLoading(false);
    }
  };

  const filterMenus = () => {
    let filtered = menus;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((menu) =>
        menu.nama_masakan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (menu) => menu.kategori.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredMenus(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const menuData = {
        ...formData,
        harga: parseFloat(formData.harga),
      };

      if (editingMenu) {
        // Update
        const { error } = await supabase
          .from('masakan')
          .update(menuData)
          .eq('id_masakan', editingMenu.id_masakan);

        if (error) throw error;
        alert('Menu berhasil diupdate!');
      } else {
        // Create
        const { error } = await supabase.from('masakan').insert([menuData]);

        if (error) throw error;
        alert('Menu berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      resetForm();
      fetchMenus();
    } catch (error: any) {
      console.error('Error saving menu:', error);
      alert('Gagal menyimpan menu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (menu: any) => {
    setEditingMenu(menu);
    setFormData({
      nama_masakan: menu.nama_masakan,
      harga: menu.harga.toString(),
      status_masakan: menu.status_masakan,
      kategori: menu.kategori,
      deskripsi: menu.deskripsi || '',
      gambar: menu.gambar || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) return;

    try {
      const { error } = await supabase.from('masakan').delete().eq('id_masakan', id);

      if (error) throw error;
      alert('Menu berhasil dihapus!');
      fetchMenus();
    } catch (error: any) {
      console.error('Error deleting menu:', error);
      alert('Gagal menghapus menu: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingMenu(null);
    setFormData({
      nama_masakan: '',
      harga: '',
      status_masakan: 'tersedia',
      kategori: 'makanan',
      deskripsi: '',
      gambar: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading && menus.length === 0) {
    return (
      <DashboardLayout allowedRoles={['administrator']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Manajemen Menu</h1>
            <p className="text-neutral-600 mt-1">Kelola menu makanan dan minuman</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Menu
          </Button>
        </div>

        {/* Search & Category Tabs with Count */}
        <div className="bg-transparent dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-white border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
            </div>

            {/* Category Buttons with Count */}
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Semua
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCategory === 'all' ? 'bg-white text-primary' : 'bg-gray-300 text-gray-700'
                    }`}
                >
                  {menus.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('makanan')}
                className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === 'makanan'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Makanan
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCategory === 'makanan'
                      ? 'bg-white text-primary'
                      : 'bg-gray-300 text-gray-700'
                    }`}
                >
                  {menus.filter((m) => m.kategori === 'makanan').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('minuman')}
                className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === 'minuman'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Minuman
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCategory === 'minuman'
                      ? 'bg-white text-primary'
                      : 'bg-gray-300 text-gray-700'
                    }`}
                >
                  {menus.filter((m) => m.kategori === 'minuman').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('dessert')}
                className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === 'dessert'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Dessert
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCategory === 'dessert'
                      ? 'bg-white text-primary'
                      : 'bg-gray-300 text-gray-700'
                    }`}
                >
                  {menus.filter((m) => m.kategori === 'dessert').length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        {filteredMenus.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada menu ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenus.map((menu) => (
              <MenuCard
                key={menu.id_masakan}
                menu={menu}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Modal Add/Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          title={editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Menu"
              name="nama_masakan"
              value={formData.nama_masakan}
              onChange={handleChange}
              placeholder="Contoh: Nasi Goreng Spesial"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="makanan">Makanan</option>
                  <option value="minuman">Minuman</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>

              <Input
                label="Harga"
                name="harga"
                type="number"
                value={formData.harga}
                onChange={handleChange}
                placeholder="25000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status_masakan"
                value={formData.status_masakan}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="tersedia">Tersedia</option>
                <option value="habis">Habis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                placeholder="Deskripsi menu..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Input
              label="URL Gambar (Opsional)"
              name="gambar"
              value={formData.gambar}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Menyimpan...' : editingMenu ? 'Update Menu' : 'Tambah Menu'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}