'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      // Redirect to dashboard based on role
      const role = user?.level?.nama_level;
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
        case 'customer':
          router.push('/dashboard/customer');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}