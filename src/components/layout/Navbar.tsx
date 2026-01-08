'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Menu, User, Settings, Moon, Sun, ChevronDown, LogOut } from 'lucide-react'; // Tambahkan LogOut untuk ikon logout

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore(); // Tambahkan logout dari store (asumsikan ada)
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dark mode (revisi: gunakan nilai baru untuk konsistensi)
  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <nav className="fixed top-0 z-30 w-full h-16 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
      <div className="flex items-center justify-between h-full px-4">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Open menu" // Tambahan untuk aksesibilitas
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>

          <div className="text-orange-600 font-bold text-2xl tracking-tight">
            Ordly
          </div>
        </div>

        {/* Right: Theme Toggle + Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors" // Standarisasi hover
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors" // Standarisasi hover
              aria-label="Open profile menu" // Tambahan untuk aksesibilitas
            >
              <div className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.nama_user}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.level?.nama_level}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-neutral-900/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 py-2 z-50">
                {/* User Info */}
                <div className="flex gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
                  <div className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.nama_user}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.level?.nama_level}
                    </p>
                  </div>
                </div>

                {/* Menu Items */}
                <div>
                  <button
                    onClick={() => alert('Navigate to Settings')} // Placeholder onClick untuk Settings
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="w-4 h-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4" />
                        Dark Mode
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => logout()} // Tambahan: Logout button
                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-gray-200 dark:border-neutral-800"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}