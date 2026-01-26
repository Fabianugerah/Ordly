// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const role = user.level?.nama_level;
      switch (role) {
        case 'administrator':
          router.push('/dashboard/admin');
          break;
        case 'waiter':
          router.push('/dashboard/waiter');
          break;
        case 'kasir':
          router.push('/dashboard/kasir');
          break;
        case 'owner':
          router.push('/dashboard/owner');
          break;
        case 'customer':
          router.push('/guest/menu');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedUsername = formData.username.trim();
    const trimmedPassword = formData.password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Username dan password tidak boleh kosong');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.login(trimmedUsername, trimmedPassword);

      // PERBAIKAN DI SINI: Tambahkan pengecekan !response.user
      if (!response.success || !response.user) {
        setError(response.error || 'Login gagal');
        setLoading(false); // Pastikan loading dimatikan
        return;
      }

      setAuth(response.user);

      const role = response.user.level?.nama_level;
      switch (role) {
        case 'administrator':
          router.push('/dashboard/admin');
          break;
        case 'waiter':
          router.push('/dashboard/waiter');
          break;
        case 'kasir':
          router.push('/dashboard/kasir');
          break;
        case 'owner':
          router.push('/dashboard/owner');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan jaringan atau server. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk Guest Access
  const handleGuestAccess = () => {
    // Create temporary guest session
    // const guestUser = { ... } // Tidak perlu deklarasi variable jika tidak dipakai langsung di sini
    
    // Set guest as temporary user (without saving to localStorage permanently)
    sessionStorage.setItem('guest_mode', 'true');
    router.push('/guest/menu');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/login.jpeg')",
        }}
      />
      <div className="absolute inset-0 bg-black/50 md:bg-transparent" />

      <div className="relative w-full max-w-5xl h-auto md:min-h-[650px] flex flex-col md:flex-row rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
        {/* LEFT – LOGIN FORM */}
        <div className="w-full md:w-[45%] bg-black/60 backdrop-blur-sm p-6 sm:p-8 md:p-10 flex flex-col justify-between">
          {/* Logo */}
          <div className="text-orange-600 mb-12 font-bold text-2xl tracking-tight">
            CaffeeIn
          </div>

          <div className="flex flex-col">
            <div className="mb-4">
              <h1 className="text-2xl font-medium text-white">Selamat Datang</h1>
              <p className="text-sm text-neutral-500 mt-2">
                Masuk untuk melanjutkan atau pesan sebagai tamu
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Masukkan Username"
                className="w-full rounded-xl bg-[#1e1e1e] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-600/50 border border-transparent transition-all"
              />

              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan Password"
                  className="w-full rounded-xl bg-[#1e1e1e] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-600/50 border border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded-full font-semibold text-sm hover:bg-neutral-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Masuk
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-neutral-700"></div>

              <span className="px-4 text-sm text-neutral-500 whitespace-nowrap">
                atau
              </span>

              <div className="flex-1 border-t border-neutral-700"></div>
            </div>


            {/* Guest Access Button */}
            <button
              onClick={handleGuestAccess}
              className="w-full bg-transparent border border-neutral-800 text-white py-3 rounded-full font-semibold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Masuk Sebagai Customer
            </button>
          </div>
        </div>

        {/* RIGHT – VISUAL */}
        <div className="hidden md:block md:flex-1 relative">
          <div className="absolute inset-0 bg-transparent" />
          <div className="relative z-10 p-12 text-center" />
        </div>
      </div>
    </div>
  );
}