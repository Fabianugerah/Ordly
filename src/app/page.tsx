'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowDown, Coffee } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [opacity, setOpacity] = useState(1);

  // 1. Cek Auth: Jika sudah login, langsung ke dashboard yang sesuai
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.level?.nama_level;
      switch (role) {
        case 'administrator': router.push('/dashboard/admin'); break;
        case 'waiter': router.push('/dashboard/waiter'); break;
        case 'kasir': router.push('/dashboard/kasir'); break;
        case 'owner': router.push('/dashboard/owner'); break;
        case 'customer': router.push('/guest/menu'); break;
        default: router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  // 2. Logic Scroll untuk Redirect ke Login
  useEffect(() => {
    // Jika user sudah login, jangan jalankan logic scroll ini
    if (isAuthenticated) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Efek fade out saat scroll
      const newOpacity = 1 - (scrollPosition / (windowHeight * 0.5));
      setOpacity(Math.max(0, newOpacity));

      // Jika scroll sudah melewati threshold (misal 100px), trigger redirect
      if (scrollPosition > 80 && !isRedirecting) {
        setIsRedirecting(true);
        // Delay sedikit biar animasinya mulus
        setTimeout(() => {
          router.push('/login');
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, isRedirecting, router]);

  // Jika sudah login/sedang redirect, tampilkan loader atau layar kosong transisi
  if (isAuthenticated || isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center transition-opacity duration-500 ease-in-out">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full opacity-50"></div>
      </div>
    );
  }

  // Tampilan Landing Page Modern
  return (
    <div 
      className="min-h-[150vh] bg-neutral-950 text-white font-sans selection:bg-orange-500/30"
      style={{ opacity: opacity }}
    >
      {/* Background Effects (Glows & Noise) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        
        {/* Warm Glow Top Left */}
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-orange-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        
        {/* Warm Glow Bottom Right */}
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] bg-amber-800/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 h-screen flex flex-col justify-between px-6 sm:px-12 py-10 max-w-[1400px] mx-auto">
        
        {/* Header / Nav Placeholder */}
        <div className="flex justify-between items-center opacity-0 animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-700 rounded-lg flex items-center justify-center">
               <Coffee className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">CaffeeIn.</span>
          </div>
          <div className="text-sm text-neutral-400 font-medium tracking-wide hidden sm:block">
            EST. 2026
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col justify-center items-start space-y-6 sm:space-y-8 mt-10">
          <div className="overflow-hidden">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-[0.9] opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              The Modern <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-orange-500 to-amber-700">
                Coffee Experience.
              </span>
            </h1>
          </div>
          
          <p className="max-w-md text-neutral-400 text-lg sm:text-xl leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            Seamless transactions, elegant management, and the perfect brew of technology and taste.
          </p>

          <button 
            onClick={() => router.push('/login')}
            className="group relative px-8 py-3 bg-white text-black rounded-full font-semibold text-sm hover:bg-neutral-200 transition-all opacity-0 animate-slide-up overflow-hidden" 
            style={{ animationDelay: '0.8s' }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started 
              <ArrowDown className="w-4 h-4 -rotate-90 group-hover:rotate-0 transition-transform duration-300" />
            </span>
          </button>
        </div>

        {/* Footer / Scroll Indicator */}
        <div className="flex flex-col items-center justify-center gap-4 pb-10 opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
          <p className="text-xs text-neutral-500 uppercase tracking-[0.2em]">Scroll to Enter</p>
          <div className="w-[1px] h-16 bg-gradient-to-b from-neutral-800 to-neutral-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-scroll-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
}