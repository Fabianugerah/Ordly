'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input'; // Menggunakan komponen Input custom
import Select from '@/components/ui/Select'; // Menggunakan komponen Select custom
import Modal from '@/components/ui/Modal';
import SuccessModal from '@/components/ui/SuccessModal'; // Pastikan path sesuai
import { Users, Plus, Edit, Trash2, Search, MoreVertical, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Edit State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Search State
  const [search, setSearch] = useState('');

  // Kebab Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama_user: '',
    id_level: 5, // Default level ID (sesuaikan jika perlu)
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Effect untuk menutup menu kebab saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null && !(event.target as Element).closest('.action-menu-trigger')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: usersData }, { data: levelsData }] = await Promise.all([
        supabase.from('users').select('*, level(*)').order('id_user'),
        supabase.from('level').select('*').order('id_level'),
      ]);

      if (usersData) setUsers(usersData);
      if (levelsData) setLevels(levelsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Update User
        const updateData: any = {
          username: formData.username,
          nama_user: formData.nama_user,
          id_level: formData.id_level,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id_user', editingUser.id_user);

        if (error) throw error;
        setSuccessMessage('Data user berhasil diperbarui!');
      } else {
        // Create User
        const { error } = await supabase.from('users').insert({
          username: formData.username,
          password: formData.password,
          nama_user: formData.nama_user,
          id_level: formData.id_level,
        });

        if (error) throw error;
        setSuccessMessage('User baru berhasil ditambahkan!');
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchData();
      setIsSuccessModalOpen(true); // Tampilkan modal sukses
    } catch (error: any) {
      alert('Error: ' + error.message); // Bisa diganti error modal jika ada
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Password dikosongkan saat edit
      nama_user: user.nama_user,
      id_level: user.id_level,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id_user', id);
      if (error) throw error;
      
      fetchData();
      setSuccessMessage('User berhasil dihapus dari sistem.');
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      nama_user: '',
      id_level: 5,
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.nama_user.toLowerCase().includes(search.toLowerCase())
  );

  // Convert levels data to Select options format
  const levelOptions = levels.map(level => ({
    value: level.id_level.toString(),
    label: level.nama_level
  }));

  if (loading && users.length === 0) {
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
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Manajemen User</h1>
            <p className="text-neutral-600 mt-1">Kelola akses dan data pengguna sistem</p>
          </div>
          <Button
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Tambah User
          </Button>
        </div>

        {/* --- Search Bar --- */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-2" />
                        <p>Tidak ada user ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id_user} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700">
                            {user.nama_user.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{user.nama_user}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">ID: {user.id_user}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300 font-mono">
                        @{user.username}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium capitalize border border-blue-200 dark:border-blue-800">
                          <Shield className="w-3 h-3" />
                          {user.level?.nama_level}
                        </span>
                      </td>
                      
                      {/* --- Action Menu (Kebab) --- */}
                      <td className="px-6 py-4 text-center relative">
                        <div className="relative inline-block action-menu-trigger">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === user.id_user ? null : user.id_user);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                                openMenuId === user.id_user 
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' 
                                : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenuId === user.id_user && (
                            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(user);
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
                                  handleDelete(user.id_user);
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
        </div>

        {/* --- Form Modal --- */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
            resetForm();
          }}
          title={editingUser ? 'Edit User' : 'Tambah User Baru'}
        >
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Contoh: admin123"
            />

            <Input
              label={`Password ${editingUser ? '(Opsional)' : '*'}`}
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Biarkan kosong jika tidak diubah' : 'Masukkan password'}
            />

            <Input
              label="Nama Lengkap"
              type="text"
              required
              value={formData.nama_user}
              onChange={(e) => setFormData({ ...formData, nama_user: e.target.value })}
              placeholder="Contoh: John Doe"
            />

            <Select
              label="Role Access"
              value={formData.id_level.toString()} // Select butuh string
              onChange={(e) => setFormData({ ...formData, id_level: parseInt(e.target.value) })}
              options={levelOptions}
              required
            />

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                {loading ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Tambah User'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
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