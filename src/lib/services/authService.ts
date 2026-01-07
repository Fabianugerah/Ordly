import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs'; 

export const authService = {
  // Login
  login: async (username: string, password: string) => {
    try {
      // Get user by username
      const { data: user, error } = await supabase
        .from('users')
        .select('*, level:level(*)')
        .eq('username', username)
        .single();

      if (password !== user.password) {
  throw new Error('Username atau password salah');
}

      // Verify password (simple comparison for now, nanti bisa pakai bcrypt)
      // Untuk cepat, kita pakai plain text dulu
      // PRODUCTION: harus pakai bcrypt!
      
      // Karena dummy data pakai hash, kita skip validasi password dulu
      // Di production, uncomment ini:
      // const isPasswordValid = await bcrypt.compare(password, user.password);
      // if (!isPasswordValid) {
      //   throw new Error('Username atau password salah');
      // }

      // Untuk demo, accept semua password
      return {
        success: true,
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