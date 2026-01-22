'use client';

import { Search, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

interface GuestNavbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export default function GuestNavbar({ searchTerm, onSearchChange }: GuestNavbarProps) {
    const router = useRouter();
    const { items } = useCartStore();

    return (
        <header className="top-0 z-50">
            <div className="max-w-[1400px] mx-auto py-4 flex items-center justify-between gap-4">

                <div className="flex items-center gap-6 max-w-2xl flex-1">
                    {/* Logo */}
                    <Link href="/login" className="flex items-center gap-2 font-extrabold text-xl text-white cursor-pointer">
                        CaffeeIn
                    </Link>
                   

                    {/* Search */}
                    <div className="hidden md:flex flex-1 max-w-xl relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 bg-transparent text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right Menu - Cart Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/guest/order')}
                        className="relative flex items-center gap-2 bg-white px-4 py-2 rounded-lg hover:bg-neutral-200"
                    >
                        <ShoppingCart className="w-5 h-5" />

                        {items.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {items.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}