'use client';

import { Search, ShoppingCart, Clock, Menu, X, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface GuestNavbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export default function GuestNavbar({ searchTerm, onSearchChange }: GuestNavbarProps) {
    const router = useRouter();
    const { items } = useCartStore();
    const [time, setTime] = useState<Date | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // LOGIKA TEMA (Sama seperti Dashboard)
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const syncTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        syncTheme();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    syncTheme();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
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
    };

    // Update waktu
    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-all duration-300">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between gap-4">

                    {/* LEFT: Logo & Search */}
                    <div className="flex items-center gap-4 sm:gap-8 flex-1">
                        <Link href="/login" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <div className="relative w-28 h-12">
                                <Image
                                    src={isDarkMode ? "/images/caffeein.svg" : "/images/caffeein_black.svg"}
                                    alt="CaffeeIn Logo"
                                    fill
                                    className="object-contain object-left dark:brightness-110"
                                    priority
                                />
                            </div>
                        </Link>

                        <div className="hidden md:flex flex-1 max-w-md relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-colors" />
                            <input
                                placeholder="Cari menu favorit..."
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-900/50 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-500 placeholder:text-neutral-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Theme Toggle, Clock, Cart */}
                    <div className="flex items-center gap-3">

                        {/* TOMBOL THEME SWITCHER (Persis Dashboard) */}
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
                        {/* Digital Clock */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-100 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 select-none">
                            <Clock className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            <span className="text-sm font-medium font-mono tabular-nums tracking-wider">
                                {time ? formatTime(time) : '00:00:00'}
                            </span>
                        </div>

                        {/* Cart Button */}
                        <button
                            onClick={() => router.push('/guest/order')}
                            className="relative flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-xl transition-all active:scale-95 hover:opacity-90"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="hidden sm:inline font-semibold text-sm">Cart</span>
                            {items.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-950 px-1">
                                    {items.length}
                                </span>
                            )}
                        </button>
                        {/* Mobile Menu Toggle Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2.5 text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="flex flex-col gap-4 p-4">

                        {/* Mobile Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                placeholder="Cari menu..."
                                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 text-black dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-500 placeholder:text-neutral-500"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>

                        {/* Mobile Clock Info */}
                        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-400">
                            <span className="text-sm font-medium">Time</span>
                            <div className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-100 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 select-none">
                                <Clock className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                <span className="text-sm font-medium font-mono tabular-nums tracking-wider">
                                    {time ? formatTime(time) : '00:00:00'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}