'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Github, Twitter, Chrome } from 'lucide-react';
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
      {/* Orange glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/20 blur-[120px] rounded-full -mr-48 -mt-48" />

      <div className="relative w-full max-w-5xl flex flex-col md:flex-row rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">

        {/* LEFT – LOGIN FORM */}
        <div className="w-full md:w-[45%] bg-[#121212] p-10 md:p-14 flex flex-col justify-center">
          {/* Logo */}
          <div className="mb-12">
            <div className="text-orange-600 font-bold text-2xl tracking-tight">
              BTR<span className="text-white text-sm">.fi</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-medium text-white">Sign in</h1>
            <p className="text-sm text-gray-500 mt-2">
              Welcome back, please login to your account.
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
              placeholder="Enter Email / Username"
              className="w-full rounded-xl bg-[#1e1e1e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-600/50 border border-transparent transition-all"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter Password"
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
                  <LogIn size={16} />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8 text-center">
            <hr className="border-white/5" />
            <span className="absolute inset-0 flex items-center justify-center bg-[#121212] px-3 text-[10px] text-gray-600 uppercase tracking-widest">
              or sign in via
            </span>
          </div>

          {/* Social */}
          <div className="flex gap-3">
            <SocialButton icon={<Chrome size={16} />} label="Google" />
            <SocialButton icon={<Github size={16} />} label="Apple" />
            <SocialButton icon={<Twitter size={16} />} label="Twitter" />
          </div>

          <p className="text-[11px] text-gray-500 text-center mt-8">
            Don’t have an account?{' '}
            <button className="text-orange-600 hover:underline">
              Sign up
            </button>
          </p>
        </div>

        {/* RIGHT – VISUAL */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-black/20 backdrop-blur-md relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent" />
          <div className="relative z-10 p-12 text-center">
            <div className="w-64 h-64 bg-[#1a1a1a] rounded-xl border border-white/20 shadow-2xl flex items-center justify-center">
              <span className="text-orange-500 font-bold text-4xl opacity-60">
                BTR
              </span>
            </div>
            <p className="text-white/40 text-[10px] mt-6 uppercase tracking-[0.25em]">
              Restaurant Management System
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex-1 flex items-center justify-center gap-2 bg-[#1e1e1e] py-2.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
      <span className="text-white">{icon}</span>
      <span className="text-[11px] text-white font-medium">{label}</span>
    </button>
  );
}
