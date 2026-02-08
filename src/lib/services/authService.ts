import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs'; 

export const authService = {
  login: async (username: string, password: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*, level:level(*)')
        .eq('username', username)
        .single();

      if (error || !user) throw new Error('Username atau password salah');

      // Proteksi password sederhana
      if (password !== user.password) {
        throw new Error('Username atau password salah');
      }

      return {
        success: true,
        // TAMBAHKAN TOKEN DI SINI
        // Karena kamu pakai Supabase manual, kita buat dummy token dari ID User
        token: `session_${user.id_user}_${Date.now()}`, 
        user: {
          id_user: user.id_user,
          username: user.username,
          nama_user: user.nama_user,
          id_level: user.id_level,
          level: user.level,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Register
  register: async (username: string, password: string, nama_user: string, id_level: number) => {
    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        throw new Error('Username sudah digunakan');
      }

      // Hash password (untuk production)
      // const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user (pakai plain password dulu untuk demo)
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          username,
          password, // Production: ganti dengan hashedPassword
          nama_user,
          id_level,
        })
        .select('*, level:level(*)')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        user: newUser,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};