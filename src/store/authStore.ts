import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, token?: string) => void;
  logout: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,

      setAuth: (user, token) => {
        set({ user, isAuthenticated: true, isInitialized: true });
        if (token) {
          // Ini yang akan dibaca oleh Middleware
          Cookies.set('token', token, { expires: 7, path: '/' });
        }
      },

      logout: () => {
        Cookies.remove('token');
        set({ user: null, isAuthenticated: false, isInitialized: true });
        localStorage.removeItem('auth-storage');
      },

      setInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);