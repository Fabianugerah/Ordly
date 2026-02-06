'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { Menu, User, Settings, Moon, Sun, ChevronDown, LogOut } from 'lucide-react';

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
    <nav className="fixed top-0 z-30 w-full h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between h-full px-4">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Open menu" // Tambahan untuk aksesibilitas
          >
            <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
          </button>

          <div className="relative w-28 h-12"> {/* Atur ukuran container logo di sini */}
            <Image
              src="/images/CaffeeIn_logo.svg"
              alt="CaffeeIn Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </div>

        {/* Right: Theme Toggle + Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" // Standarisasi hover
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            ) : (
              <Moon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" // Standarisasi hover
              aria-label="Open profile menu" // Tambahan untuk aksesibilitas
            >
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
              <ChevronDown
                className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-2 z-50">
                {/* User Info */}
                <div className="flex gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
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

                {/* Menu Items */}
                <div>
                  <button
                    onClick={() => alert('Navigate to Settings')} // Placeholder onClick untuk Settings
                    className="w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className="w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
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
                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-neutral-200 dark:border-neutral-800"
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