'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function GuestFooter() {
  // LOGIKA TEMA: Sinkronisasi dengan class "dark" di <html>
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    syncTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') syncTheme();
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    // Container Utama Footer: bg-white untuk Light Mode, bg-neutral-950 untuk Dark Mode
    <footer className="bg-neutral-50 dark:bg-neutral-950 pt-10 lg:pt-20 border-t border-neutral-200 dark:border-neutral-800 mt-10 lg:mt-16 flex flex-col justify-between transition-colors duration-300">

      {/* BAGIAN ATAS: Konten Utama Footer */}
      <div className="max-w-[1440px] mx-auto px-6 w-full flex-grow mb-16 lg:mb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-6">

          {/* KOLOM 1: Brand & Copyright */}
          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            <div className="flex flex-col h-full">
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
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
                <div className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  <p className="font-medium text-neutral-900 dark:text-neutral-200">Modern Coffee Shop</p>
                  <p>CAFFEEIN Goods Ltd.</p>
                </div>
              </div>

              {/* Copyright */}
              <div className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
                <p>© 2026 All rights reserved.</p>
              </div>
            </div>
          </div>

          {/* KOLOM 2: Company */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 lg:mb-6">Company</h4>
            <ul className="space-y-3 lg:space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Settings</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* KOLOM 3: Support */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 lg:mb-6">Support</h4>
            <ul className="space-y-3 lg:space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Payment</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Delivery</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* KOLOM 4: Follow Us */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 lg:mb-6">Follow Us</h4>
            <ul className="space-y-3 lg:space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Instagram</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Facebook</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">TikTok</Link></li>
              <li><Link href="#" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Twitter</Link></li>
            </ul>
          </div>

          {/* KOLOM 5: Newsletter */}
          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 lg:mb-6">Get our newsletters:</h4>

            <div className="flex w-full mb-4">
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm px-4 py-3 rounded-l-lg outline-none focus:border-neutral-800 dark:focus:border-neutral-700 placeholder:text-neutral-400 transition-colors"
              />
              <button className="bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white px-4 rounded-r-lg transition-all duration-300 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white dark:text-black" />
              </button>
            </div>

            <div className="flex gap-4 text-xs text-neutral-400">
              <Link href="#" className="underline hover:text-neutral-700 dark:hover:text-neutral-300 decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                Terms & Conditions
              </Link>
              <Link href="#" className="underline hover:text-neutral-700 dark:hover:text-neutral-300 decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                Privacy Policy
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* BAGIAN BAWAH: LOGO SVG BESAR */}
      <div className="w-full mt-auto">
        <Image
          src={isDarkMode ? "/images/caffeein.svg" : "/images/caffeein_black.svg"}
          alt="CaffeeIn Huge Logo Footer"
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto select-none pointer-events-none transition-all duration-500"
        />
      </div>

    </footer>
  );
}