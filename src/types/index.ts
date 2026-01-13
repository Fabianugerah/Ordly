// User & Level Types
export interface Level {
  id_level: number;
  nama_level: 'administrator' | 'waiter' | 'kasir' | 'owner' | 'customer';
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id_user: number;
  username: string;
  nama_user: string;
  id_level: number;
  level?: Level;
  created_at?: string;
  updated_at?: string;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nama_user: string;
  id_level: number;
}

// Masakan Types
export interface Masakan {
  id_masakan: number;
  nama_masakan: string;
  harga: number;
  status_masakan: 'tersedia' | 'habis';
  kategori?: string;
  deskripsi?: string;
  gambar?: string;
  created_at?: string;
  updated_at?: string;
}

// Order Types
export interface OrderItem {
  id_masakan: number;
  jumlah: number;
  keterangan?: string;
}

export interface CreateOrderRequest {
  no_meja: string;
  tanggal: string;
  keterangan?: string;
  items: OrderItem[];
}

export interface DetailOrder {
  id_detail_order: number;
  id_order: number;
  id_masakan: number;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  keterangan?: string;
  status_detail_order: 'pending' | 'diproses' | 'selesai';
  masakan?: Masakan;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id_order: number;
  no_meja: string;
  tanggal: string;
  id_user: number;
  keterangan?: string;
  status_order: 'pending' | 'proses' | 'selesai' | 'dibatalkan';
  total_harga: number;
  user?: User;
  detailOrders?: DetailOrder[];
  created_at?: string;
  updated_at?: string;
}

// Transaksi Types
export interface CreateTransaksiRequest {
  id_order: number;
  tanggal: string;
  total_bayar: number;
  uang_diterima: number;
  metode_pembayaran: 'tunai' | 'debit' | 'qris';
}

export interface Transaksi {
  id_transaksi: number;
  id_user: number;
  id_order: number;
  tanggal: string;
  total_bayar: number;
  uang_diterima: number;
  kembalian: number;
  metode_pembayaran: 'tunai' | 'debit' | 'qris';
  user?: User;
  order?: Order;
  created_at?: string;
  updated_at?: string;
}

// Laporan Types
export interface LaporanOrder {
  total_orders: number;
  total_pendapatan: number;
  orders: Order[];
}

export interface LaporanTransaksi {
  total_transaksi: number;
  total_pendapatan: number;
  transaksi: Transaksi[];
}

export interface MenuTerlaris {
  id_masakan: number;
  total_terjual: number;
  total_pendapatan: number;
  masakan: Masakan;
}

export interface Pendapatan {
  tanggal?: string;
  tahun?: number;
  bulan?: number;
  total_pendapatan: number;
  jumlah_transaksi: number;
}