'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GuestFooter() {
  return (
    <footer className="bg-neutral-900 pt-20 pb-12 border-t border-neutral-800 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Grid Layout: 5 Kolom (Sesuai Referensi Sprout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          {/* KOLOM 1: Brand & Copyright */}
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h3 className="font-extrabold text-2xl text-orange-500 tracking-tight">
                CaffeeIn
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
                Fresh & healthy food delivered directly to your table with the best quality ingredients.
              </p>
            </div>
            
            {/* Copyright ditaruh di sini (Sesuai Gambar) */}
            <div className="mt-8 md:mt-0 text-xs text-neutral-500">
              <p>© 2026 CaffeeIn.</p>
              <p>All rights reserved.</p>
            </div>
          </div>

          {/* KOLOM 2: Menu (Konten Asli Anda) */}
          <div>
            <h4 className="font-semibold text-white mb-6">Menu</h4>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li><Link href="#" className="hover:text-orange-500 transition-colors">All Products</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Makanan</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Minuman</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Dessert</Link></li>
            </ul>
          </div>

          {/* KOLOM 3: Support (Konten Asli Anda) */}
          <div>
            <h4 className="font-semibold text-white mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Payment</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Delivery</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* KOLOM 4: Company (Konten Asli Anda) */}
          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li><Link href="#" className="hover:text-orange-500 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* KOLOM 5: Newsletter (Baru - Sesuai Gambar) */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-white mb-6">Get our newsletters:</h4>
            
            {/* Input Email Style */}
            <div className="flex w-full mb-4">
              <input 
                type="email" 
                placeholder="Your email" 
                className="w-full bg-white text-neutral-900 text-sm px-4 py-3 rounded-l-lg outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-neutral-500"
              />
              <button className="bg-neutral-800 hover:bg-orange-500 text-white px-3 rounded-r-lg transition-colors flex items-center justify-center border border-l-0 border-neutral-700 hover:border-orange-500">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Link Kecil di Bawah Input */}
            <div className="flex flex-col gap-1 text-xs text-neutral-500">
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