'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(
        formData.username,
        formData.password
      );

      if (!response.success) {
        setError(response.error || 'Login gagal');
        return;
      }

      // Simpan user ke store
      setAuth(response.user);

      // 🔑 ROLE-BASED REDIRECT (SAMA SEPERTI YANG LAMA)
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
        case 'pelanggan':
          router.push('/dashboard/customer');
          break;
        default:
          router.push('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
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
          <div className="text-orange-600 mb-16 font-bold text-2xl tracking-tight">
            Ordly
          </div>


          <div className="flex flex-col">
            <div className="mb-8">
              <h1 className="text-2xl font-medium text-white">Selamat Datang</h1>
              <p className="text-sm text-gray-500 mt-2">
                Masukkan Username dan Password Anda.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Masukkan Username"
                className="w-full rounded-xl bg-[#1e1e1e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-600/50 border border-transparent transition-all"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan Password"
                  className="w-full rounded-xl bg-[#1e1e1e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-600/50 border border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded-full font-semibold text-sm hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Masuk
                  </>
                )}
              </button>
            </form>
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
