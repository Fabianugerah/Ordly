'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, User, Settings, Moon, Sun, ChevronDown, LogOut } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleToUrlMap: { [key: string]: string } = {
    administrator: 'admin',
    waiter: 'waiter',
    kasir: 'kasir',
    owner: 'owner',
    customer: 'customer',
  };

  // FUNGSI UTAMA: Sinkronisasi tema dengan DOM
  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Jalankan saat pertama kali mount
    syncTheme();

    // Pantau perubahan class pada <html> secara real-time
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          syncTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Pantau perubahan dari tab lain (optional)
    window.addEventListener('storage', syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const toggleDarkMode = () => {
    const newThemeIsDark = !isDarkMode;
    if (newThemeIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // State isDarkMode akan terupdate otomatis oleh MutationObserver di atas
  };

  const handleSettingsNavigate = () => {
    const role = user?.level?.nama_level;
    const rolePath = role ? roleToUrlMap[role] || role : '';
    if (rolePath) {
      router.push(`/dashboard/${rolePath}/settings`);
      setShowProfileMenu(false);
    }
  };

  return (
    <nav className="fixed top-0 z-30 w-full h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-4">

        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
          </button>

          <div className="relative w-28 h-12">
            <Image
              src="/images/caffeein.svg"
              alt="CaffeeIn Logo"
              fill
              className="object-contain object-left dark:brightness-110"
              priority
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle: Menampilkan ikon kebalikan dari mode saat ini */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 group"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500 rotate-0 transition-transform duration-500 group-hover:rotate-90" />
            ) : (
              <Moon className="w-5 h-5 text-neutral-600 rotate-0 transition-transform duration-500 group-hover:-rotate-12" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center border border-neutral-300 dark:border-neutral-600">
                <User className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                  {user?.nama_user || 'User'}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize">
                  {user?.level?.nama_level || 'Guest'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-2 z-50">
                {/* User Info */}
                <div className="flex gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="w-9 h-9 bg-neutral-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {user?.nama_user}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                      {user?.level?.nama_level}
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                >
                  {isDarkMode ? (
                    <><Sun className="w-4 h-4 text-yellow-500" /> Light Mode</>
                  ) : (
                    <><Moon className="w-4 h-4 text-blue-500" /> Dark Mode</>
                  )}
                </button>

                <button
                  onClick={handleSettingsNavigate}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                <button
                  onClick={() => logout()}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}