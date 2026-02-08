'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // State untuk melacak tema yang aktif (sync dengan Navbar)
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    nama_user: user?.nama_user || '',
    username: user?.username || '',
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    paymentAlerts: true,
    systemNotifications: false,
    emailNotifications: true,
  });

  // LOGIKA SINKRONISASI TEMA
  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setActiveTheme(isDark ? 'dark' : 'light');
    };

    syncTheme(); // Cek saat pertama kali load

    // Observer untuk memantau perubahan class di tag <html> (perubahan dari Navbar)
    const observer = new MutationObserver(() => syncTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    if (success || error) {
      const timer = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
      return () => clearTimeout(timer);
    }

    return () => observer.disconnect();
  }, [success, error]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // State activeTheme akan terupdate otomatis via Observer di atas
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate
      if (!profileForm.nama_user.trim() || !profileForm.username.trim()) {
        setError('Nama dan username tidak boleh kosong');
        return;
      }

      // Check if username already exists (except current user)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id_user')
        .eq('username', profileForm.username)
        .neq('id_user', user?.id_user)
        .single();

      if (existingUser) {
        setError('Username sudah digunakan oleh user lain');
        return;
      }

      // Update profile
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          nama_user: profileForm.nama_user,
          username: profileForm.username,
        })
        .eq('id_user', user?.id_user)
        .select('*, level:level(*)')
        .single();

      if (updateError) throw updateError;

      // Update auth store
      setAuth(data);
      setSuccess('Profil berhasil diperbarui!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate
      if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setError('Semua field password harus diisi');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('Password baru dan konfirmasi tidak cocok');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError('Password baru minimal 6 karakter');
        return;
      }

      // Get current user data
      const { data: userData } = await supabase
        .from('users')
        .select('password')
        .eq('id_user', user?.id_user)
        .single();

      if (!userData) {
        setError('User tidak ditemukan');
        return;
      }

      // Verify old password (plain text comparison for demo)
      // In production, use bcrypt.compare()
      if (userData.password !== passwordForm.oldPassword) {
        setError('Password lama tidak sesuai');
        return;
      }

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: passwordForm.newPassword })
        .eq('id_user', user?.id_user);

      if (updateError) throw updateError;

      // Reset form
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccess('Password berhasil diubah!');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    setSuccess(`Theme berhasil diubah ke ${newTheme ? 'Dark' : 'Light'} Mode`);
  };

  const handleNotificationSave = () => {
    // Save to localStorage for demo
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setSuccess('Pengaturan notifikasi berhasil disimpan!');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Keamanan', icon: Lock },
    { id: 'appearance', label: 'Tampilan', icon: Palette },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
  ];

  return (
    <DashboardLayout allowedRoles={['administrator', 'waiter', 'kasir', 'owner', 'customer']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Pengaturan</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Kelola profil dan preferensi akun Anda
          </p>
        </div>

        {/* Alert Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <Card className="p-2 border border-neutral-800">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-neutral-800 text-white shadow-md'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card title="Informasi Profil" className="border border-neutral-800">
                <div className="space-y-6">
                  {/* User Info Display */}
                  <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="w-16 h-16 bg-neutral-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white">{user?.nama_user}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">@{user?.username}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 capitalize mt-1">
                        Role: {user?.level?.nama_level}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Nama Lengkap"
                      value={profileForm.nama_user}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, nama_user: e.target.value })
                      }
                      placeholder="Masukkan nama lengkap"
                    />

                    <Input
                      label="Username"
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, username: e.target.value })
                      }
                      placeholder="Masukkan username"
                    />

                    <div className="pt-4">
                      <Button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card title="Keamanan Akun" className="border border-neutral-800">
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-red-900/20 border border-blue-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      🔒 Pastikan password Anda kuat dan unik. Jangan gunakan password yang sama dengan akun lain.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Password Lama
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          value={passwordForm.oldPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          placeholder="Masukkan password lama"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                          {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Password Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          placeholder="Masukkan password baru (min. 6 karakter)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Konfirmasi Password Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                          placeholder="Ulangi password baru"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handlePasswordChange}
                        disabled={loading}
                        className="flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        {loading ? 'Mengubah...' : 'Ubah Password'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* TAB TAMPILAN (YANG DISESUAIKAN SINKRONISASINYA) */}
            {activeTab === 'appearance' && (
              <Card title="Pengaturan Tampilan" className="border border-neutral-200 dark:border-neutral-800">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Pilih Tema</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Light Mode Card */}
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`p-6 border-2 rounded-xl transition-all relative ${
                          activeTheme === 'light'
                            ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-900/10'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-16 h-16 rounded-lg shadow-sm flex items-center justify-center ${activeTheme === 'light' ? 'bg-white text-orange-500' : 'bg-neutral-100 text-neutral-400'}`}>
                            <Sun className="w-8 h-8" />
                          </div>
                          <p className={`font-semibold ${activeTheme === 'light' ? 'text-orange-600' : 'text-neutral-500'}`}>Light Mode</p>
                          {activeTheme === 'light' && <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-orange-500" />}
                        </div>
                      </button>

                      {/* Dark Mode Card */}
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`p-6 border-2 rounded-xl transition-all relative ${
                          activeTheme === 'dark'
                            ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-900/10'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-16 h-16 rounded-lg shadow-sm flex items-center justify-center ${activeTheme === 'dark' ? 'bg-neutral-900 text-blue-400' : 'bg-neutral-100 text-neutral-400'}`}>
                            <Moon className="w-8 h-8" />
                          </div>
                          <p className={`font-semibold ${activeTheme === 'dark' ? 'text-orange-600' : 'text-neutral-500'}`}>Dark Mode</p>
                          {activeTheme === 'dark' && <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-orange-500" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      💡 Tema akan otomatis tersimpan dan diterapkan setiap kali Anda membuka aplikasi.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card title="Preferensi Notifikasi" className="border border-neutral-800">
                <div className="space-y-6">
                  <div className="space-y-4">
                    {[
                      {
                        key: 'orderUpdates',
                        label: 'Update Pesanan',
                        description: 'Notifikasi saat status pesanan berubah',
                      },
                      {
                        key: 'paymentAlerts',
                        label: 'Alert Pembayaran',
                        description: 'Notifikasi untuk transaksi pembayaran',
                      },
                      {
                        key: 'systemNotifications',
                        label: 'Notifikasi Sistem',
                        description: 'Update dan informasi sistem penting',
                      },
                      {
                        key: 'emailNotifications',
                        label: 'Email Notifications',
                        description: 'Terima notifikasi melalui email',
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-neutral-900 dark:text-white">
                            {item.label}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {item.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                [item.key]: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleNotificationSave}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Preferensi
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}