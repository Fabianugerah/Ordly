'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Edit, Trash2, Upload, X, AlertCircle } from 'lucide-react';

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadError, setUploadError] = useState('');

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

    if (searchTerm) {
      filtered = filtered.filter((menu) =>
        menu.nama_masakan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (menu) => menu.kategori.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredMenus(filtered);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, GIF, dll)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB');
      return;
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu/${fileName}`;

      console.log('Uploading to:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('Bucket not found')) {
          setUploadError('❌ Bucket "images" belum dibuat di Supabase Storage! Silakan buat bucket terlebih dahulu.');
        } else {
          setUploadError(`Upload gagal: ${uploadError.message}`);
        }
        return;
      }

      console.log('Upload success:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      setFormData({ ...formData, gambar: publicUrl });
      setImagePreview(publicUrl);
      setUploadError('');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gambar) {
      setUploadError('Gambar harus diupload!');
      return;
    }

    setLoading(true);

    try {
      const menuData = {
        ...formData,
        harga: parseFloat(formData.harga),
      };

      if (editingMenu) {
        // Delete old image if exists and different from new one
        if (editingMenu.gambar && editingMenu.gambar !== formData.gambar) {
          const oldPath = editingMenu.gambar.split('/').slice(-2).join('/');
          await supabase.storage.from('images').remove([oldPath]);
        }

        const { error } = await supabase
          .from('masakan')
          .update(menuData)
          .eq('id_masakan', editingMenu.id_masakan);

        if (error) throw error;
        alert('Menu berhasil diupdate!');
      } else {
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
    setImagePreview(menu.gambar || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, gambar?: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) return;

    try {
      // Delete image from storage if exists
      if (gambar) {
        const filePath = gambar.split('/').slice(-2).join('/');
        await supabase.storage.from('images').remove([filePath]);
      }

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
    setImagePreview('');
    setUploadError('');
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

  const removeImage = async () => {
    if (formData.gambar) {
      try {
        const filePath = formData.gambar.split('/').slice(-2).join('/');
        await supabase.storage.from('images').remove([filePath]);
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }
    setFormData({ ...formData, gambar: '' });
    setImagePreview('');
    setUploadError('');
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

        {/* Search & Filter */}
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

            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              {['all', 'makanan', 'minuman', 'dessert'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-neutral-800 text-white shadow-md'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  {category === 'all' ? 'Semua' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Gambar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Nama Menu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredMenus.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      Tidak ada menu ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map((menu) => (
                    <tr key={menu.id_masakan} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <td className="px-6 py-4">
                        {menu.gambar ? (
                          <img
                            src={menu.gambar}
                            alt={menu.nama_masakan}
                            className="w-16 h-16 object-cover rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center text-2xl">
                            🍽️
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">{menu.nama_masakan}</p>
                          {menu.deskripsi && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">{menu.deskripsi}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-neutral-700/60 text-blue-800 dark:text-neutral-300 rounded-full text-xs capitalize">
                          {menu.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          Rp {parseFloat(menu.harga).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            menu.status_masakan === 'tersedia'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {menu.status_masakan === 'tersedia' ? 'Tersedia' : 'Habis'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(menu)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(menu.id_masakan, menu.gambar)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Add/Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          title={editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
        >
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Gambar Menu <span className="text-red-500">*</span>
              </label>
              
              {uploadError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              {imagePreview ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-neutral-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-neutral-300 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-neutral-50 hover:bg-neutral-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-neutral-400 mb-3" />
                    <p className="mb-2 text-sm text-neutral-500">
                      <span className="font-semibold">Klik untuk upload gambar</span>
                    </p>
                    <p className="text-xs text-neutral-500">PNG, JPG, GIF (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Mengupload gambar...
                </div>
              )}
            </div>

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
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Kategori
                </label>
                <select
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                name="status_masakan"
                value={formData.status_masakan}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="tersedia">Tersedia</option>
                <option value="habis">Habis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                placeholder="Deskripsi menu..."
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSubmit}
                className="flex-1" 
                disabled={loading || uploading || !formData.gambar}
              >
                {loading ? 'Menyimpan...' : editingMenu ? 'Update Menu' : 'Tambah Menu'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                variant="outline"
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
} 