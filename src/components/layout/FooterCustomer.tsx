'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GuestFooter() {
  return (
    // INFO: Padding 'py-10' untuk mobile, 'lg:pt-20 lg:pb-20' agar laptop tetap sama
    <footer className="bg-neutral-900 py-10 lg:pt-20 lg:pb-20 border-t border-neutral-800 mt-10 lg:mt-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* GRID SYSTEM RESPONSIVE:
           - grid-cols-1 : Default (Mobile) 1 kolom ke bawah
           - md:grid-cols-4 : Tablet jadi 4 kolom
           - lg:grid-cols-12 : Laptop kembali ke 12 kolom (Style Asli Anda)
        */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-6">

          {/* KOLOM 1: Brand & Copyright */}
          {/* Mobile: 1 baris penuh, Laptop: 3 kolom */}
          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            <div className="flex flex-col h-full">
              <div className="space-y-3">
                <h3 className="font-extrabold text-2xl text-orange-500 tracking-tight">
                  CaffeeIn
                </h3>
                <div className="text-sm text-neutral-400 leading-relaxed">
                  <p>Modern Coffee Shop</p>
                  <p>CAFFEEIN Goods Ltd.</p>
                </div>
              </div>

              {/* Copyright */}
              <div className="mt-4 text-xs text-neutral-500">
                <p>© 2026 All rights reserved.</p>
              </div>
            </div>
          </div>

          {/* KOLOM 2: Menu */}
          {/* Mobile: 1 kolom, Laptop: 2 kolom */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 lg:mb-6">Company</h4>
            <ul className="space-y-3 lg:space-y-4 text-sm text-neutral-400">
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">About Us</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Settings</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* KOLOM 3: Support */}
          {/* Mobile: 1 kolom, Laptop: 2 kolom */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 lg:mb-6">Support</h4>
            <ul className="space-y-3 lg:space-y-4 text-sm text-neutral-400">
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Help Center</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Payment</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Delivery</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">FAQ</Link></li>
            </ul>
          </div>

          {/* KOLOM 4: Follow Us */}
          {/* Mobile: 1 kolom, Laptop: 2 kolom */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 lg:mb-6">Follow Us</h4>
            <ul className="space-y-3 lg:space-y-4 text-sm text-neutral-400">
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Instagram</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Facebook</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">TikTok</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-all duration-300">Twitter</Link></li>
            </ul>
          </div>
          
          {/* KOLOM 5: Newsletter */}
          {/* Mobile: 1 baris penuh, Laptop: 3 kolom */}
          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            <h4 className="font-semibold text-white mb-4 lg:mb-6">Get our newsletters:</h4>

            {/* Input Email Style */}
            <div className="flex w-full mb-4">
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-white text-neutral-900 text-sm px-4 py-3 rounded-l-lg outline-none placeholder:text-neutral-500"
              />
              <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 rounded-r-lg transition-all duration-300 flex items-center justify-center border border-l-0 border-neutral-700 hover:border-neutral-600">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Link Kecil di Bawah Input */}
            <div className="flex gap-4 text-xs text-neutral-500">
              <Link href="#" className="underline hover:text-neutral-300 decoration-neutral-600 underline-offset-2">
                Terms & Conditions
              </Link>
              <Link href="#" className="underline hover:text-neutral-300 decoration-neutral-600 underline-offset-2">
                Privacy Policy
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}