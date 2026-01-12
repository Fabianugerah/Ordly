'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama_user: '',
    id_level: 5,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
        // Update
        const updateData: any = {
          username: formData.username,
          nama_user: formData.nama_user,
          id_level: formData.id_level,
        };
        
        // Only update password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id_user', editingUser.id_user);

        if (error) throw error;
        alert('User berhasil diupdate!');
      } else {
        // Create
        const { error } = await supabase.from('users').insert({
          username: formData.username,
          password: formData.password,
          nama_user: formData.nama_user,
          id_level: formData.id_level,
        });

        if (error) throw error;
        alert('User berhasil ditambahkan!');
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
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
      alert('User berhasil dihapus!');
      fetchData();
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

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Manajemen User</h1>
            <p className="text-neutral-600 mt-1">Kelola pengguna sistem</p>
          </div>
          <Button
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah User
          </Button>
        </div>

        <Card>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border bg-transparent dark:text-white border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-400">ID</th>
                  <th className="p-4 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-400">Username</th>
                  <th className="p-4 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-400">Nama</th>
                  <th className="p-4 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-400">Role</th>
                  <th className="p-4 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id_user} className="text-white hover:bg-neutral-800">
                    <td className="p-4 text-sm">{user.id_user}</td>
                    <td className="p-4 text-sm font-medium">{user.username}</td>
                    <td className="p-4 text-sm">{user.nama_user}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-neutral-800 text-blue-800 dark:text-neutral-400 rounded-full text-xs capitalize">
                        {user.level?.nama_level}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id_user)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
            resetForm();
          }}
          title={editingUser ? 'Edit User' : 'Tambah User Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Password {editingUser ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={formData.nama_user}
                onChange={(e) => setFormData({ ...formData, nama_user: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Role *
              </label>
              <select
                required
                value={formData.id_level}
                onChange={(e) => setFormData({ ...formData, id_level: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {levels.map((level) => (
                  <option key={level.id_level} value={level.id_level}>
                    {level.nama_level}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingUser ? 'Update' : 'Tambah'}
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
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}