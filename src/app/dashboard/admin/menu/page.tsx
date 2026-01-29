'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import SuccessModal from '@/components/ui/SuccessModal';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Edit, Trash2, Upload, X, AlertCircle, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { MENU_CATEGORIES, MENU_STATUS } from '@/constants/options';

// Opsi untuk Filter Dropdown
const FILTER_CATEGORIES = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'makanan', label: 'Makanan' },
  { value: 'minuman', label: 'Minuman' },
  { value: 'dessert', label: 'Dessert' },
];

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Jumlah item per halaman

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);

  // Action Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Update: Reset halaman ke 1 saat filter berubah
  useEffect(() => {
    filterMenus();
    setCurrentPage(1);
  }, [menus, searchTerm, selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null && !(event.target as Element).closest('.action-menu-trigger')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

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

  // --- LOGIC PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMenus.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, GIF, dll)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 20MB');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, gambar: publicUrl });
      setImagePreview(publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(`Upload gagal: ${error.message}`);
    } finally {
      setUploading(false);
    }
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
        if (editingMenu.gambar && editingMenu.gambar !== formData.gambar) {
          const oldPath = editingMenu.gambar.split('/').slice(-2).join('/');
          await supabase.storage.from('images').remove([oldPath]);
        }

        const { error } = await supabase
          .from('masakan')
          .update(menuData)
          .eq('id_masakan', editingMenu.id_masakan);

        if (error) throw error;
        setSuccessMessage('Menu berhasil diperbarui!');
      } else {
        const { error } = await supabase.from('masakan').insert([menuData]);
        if (error) throw error;
        setSuccessMessage('Menu baru berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      resetForm();
      fetchMenus();
      setIsSuccessModalOpen(true);

    } catch (error: any) {
      console.error('Error saving menu:', error);
      alert('Gagal menyimpan menu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, gambar?: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) return;

    try {
      if (gambar) {
        const filePath = gambar.split('/').slice(-2).join('/');
        await supabase.storage.from('images').remove([filePath]);
      }

      const { error } = await supabase.from('masakan').delete().eq('id_masakan', id);

      if (error) throw error;

      fetchMenus();
      setSuccessMessage('Menu berhasil dihapus dari database.');
      setIsSuccessModalOpen(true);

    } catch (error: any) {
      console.error('Error deleting menu:', error);
      alert('Gagal menghapus menu: ' + error.message);
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

  const handleChange = (e: any) => {
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

        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Manajemen Menu</h1>
            <p className="text-neutral-600 mt-1">Kelola menu makanan dan minuman restoran</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Tambah Menu
          </Button>
        </div>

        {/* --- Search & Filter --- */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari nama menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                options={FILTER_CATEGORIES}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="!bg-neutral-50 dark:!bg-neutral-800 !py-2.5"
              />
            </div>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Gambar</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Nama Menu</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">🍲</span>
                        <p>Tidak ada menu ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((menu) => (
                    <tr key={menu.id_masakan} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        {menu.gambar ? (
                          <img
                            src={menu.gambar}
                            alt={menu.nama_masakan}
                            className="w-16 h-16"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-xl border border-neutral-200 dark:border-neutral-700">
                            🍽️
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">{menu.nama_masakan}</p>
                          {menu.deskripsi && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">{menu.deskripsi}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md text-xs font-medium capitalize border border-neutral-200 dark:border-neutral-700">
                          {menu.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-neutral-900 dark:text-white tabular-nums">
                          Rp {parseFloat(menu.harga).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${menu.status_masakan === 'tersedia'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                            }`}
                        >
                          {menu.status_masakan === 'tersedia' ? 'Tersedia' : 'Habis'}
                        </span>
                      </td>

                      {/* --- KOLOM AKSI (DROPDOWN MENU) --- */}
                      <td className="px-6 py-4 text-center relative">
                        <div className="relative inline-block action-menu-trigger">
                          {/* Trigger Button (3 Dots) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Mencegah event click tembus ke document
                              setOpenMenuId(openMenuId === menu.id_masakan ? null : menu.id_masakan);
                            }}
                            className={`p-2 rounded-lg transition-colors ${openMenuId === menu.id_masakan
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
                              }`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === menu.id_masakan && (
                            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(menu);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(menu.id_masakan, menu.gambar);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- FOOTER PAGINATION (ADDED) --- */}
          {filteredMenus.length > 0 && (
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Menampilkan <span className="font-medium text-neutral-900 dark:text-white">{indexOfFirstItem + 1}</span> sampai <span className="font-medium text-neutral-900 dark:text-white">{Math.min(indexOfLastItem, filteredMenus.length)}</span> dari <span className="font-medium text-neutral-900 dark:text-white">{filteredMenus.length}</span> menu
              </p>

              <div className="flex items-center gap-2">

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="!h-10 !w-10 !p-0 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Logic Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(num => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1))
                    .map((number, index, array) => {
                      const showEllipsis = index > 0 && number > array[index - 1] + 1;
                      return (
                        <div key={number} className="flex items-center gap-1">
                          {showEllipsis && <span className="px-2 text-neutral-400">...</span>}
                          <button
                            onClick={() => paginate(number)}
                            className={`h-10 w-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === number
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                          >
                            {number}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="!h-10 !w-10 !p-0 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* --- Form Modal (Add/Edit) --- */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          title={editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
        >
          <div className="space-y-4">
            {/* ... (Konten Modal Sama Persis Seperti Sebelumnya) ... */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-2">
                Gambar Menu <span className="text-red-500">*</span>
              </label>

              {uploadError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              {imagePreview ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-700">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all bg-transparent group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-neutral-400 group-hover:text-orange-500" />
                    </div>
                    <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">Klik untuk upload</span>
                    </p>
                    <p className="text-xs text-neutral-400">PNG, JPG (MAX. 20MB)</p>
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
                <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
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
              <Select
                label="Kategori"
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                options={MENU_CATEGORIES}
                required
              />
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

            <Select
              label="Status"
              name="status_masakan"
              value={formData.status_masakan}
              onChange={handleChange}
              options={MENU_STATUS}
              required
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-1">
                Deskripsi
              </label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                placeholder="Deskripsi singkat menu..."
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-neutral-400"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={loading || uploading || !formData.gambar}
              >
                {loading ? 'Menyimpan...' : editingMenu ? 'Simpan Perubahan' : 'Tambah Menu'}
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

        {/* --- Success Modal --- */}
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          message={successMessage}
        />

      </div>
    </DashboardLayout>
  );
}