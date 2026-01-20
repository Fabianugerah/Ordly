// src/lib/services/paymentService.ts
import { supabase } from '@/lib/supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'qris' | 'ewallet' | 'bank_transfer' | 'cash';
  icon: string;
  fee?: number;
  instructions?: string;
  value: string; // Value yang akan disimpan di database
}

export interface PaymentRequest {
  id_order: number;
  id_user: number;
  total_bayar: number;
  metode_pembayaran: string;
  payment_type: 'qris' | 'ewallet' | 'bank_transfer';
  payment_details?: {
    provider?: string; // e.g., 'gopay', 'ovo', 'dana', 'bca', 'mandiri'
    account_number?: string;
    account_name?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  transaksi?: any;
  payment_info?: {
    qr_code?: string;
    virtual_account?: string;
    deep_link?: string;
    expires_at?: string;
  };
}

// Available payment methods
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'qris',
    name: 'QRIS',
    type: 'qris',
    value: 'qris', // Sesuaikan dengan database kasir
    icon: '📱',
    instructions: 'Scan QR code menggunakan aplikasi banking atau e-wallet Anda',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'ewallet',
    value: 'qris', // Gunakan qris karena gopay pakai QR juga
    icon: '🟢',
    instructions: 'Buka aplikasi Gojek dan pilih GoPay',
  },
  {
    id: 'ovo',
    name: 'OVO',
    type: 'ewallet',
    value: 'qris', // Gunakan qris karena ovo pakai QR juga
    icon: '🟣',
    instructions: 'Buka aplikasi OVO untuk melakukan pembayaran',
  },
  {
    id: 'dana',
    name: 'DANA',
    type: 'ewallet',
    value: 'qris', // Gunakan qris karena dana pakai QR juga
    icon: '🔵',
    instructions: 'Buka aplikasi DANA untuk melakukan pembayaran',
  },
  {
    id: 'bca',
    name: 'BCA Virtual Account',
    type: 'bank_transfer',
    value: 'debit', // Gunakan debit untuk transfer bank
    icon: '🏦',
    instructions: 'Transfer ke nomor Virtual Account BCA',
  },
  {
    id: 'mandiri',
    name: 'Mandiri Virtual Account',
    type: 'bank_transfer',
    value: 'debit', // Gunakan debit untuk transfer bank
    icon: '🏦',
    instructions: 'Transfer ke nomor Virtual Account Mandiri',
  },
  {
    id: 'bni',
    name: 'BNI Virtual Account',
    type: 'bank_transfer',
    value: 'debit', // Gunakan debit untuk transfer bank
    icon: '🏦',
    instructions: 'Transfer ke nomor Virtual Account BNI',
  },
];

class PaymentService {
  // Generate QR Code (mock implementation)
  private generateQRCode(orderId: number, amount: number): string {
    // In production, integrate with actual payment gateway
    const qrData = `QRIS-${orderId}-${amount}-${Date.now()}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  }

  // Generate Virtual Account Number (mock implementation)
  private generateVirtualAccount(provider: string, orderId: number): string {
    const prefix = {
      bca: '70012',
      mandiri: '88008',
      bni: '88009',
    }[provider] || '99999';
    
    return `${prefix}${String(orderId).padStart(10, '0')}`;
  }

  // Generate e-wallet deep link (mock implementation)
  private generateDeepLink(provider: string, orderId: number, amount: number): string {
    const links = {
      gopay: `gojek://gopay/pay?order_id=${orderId}&amount=${amount}`,
      ovo: `ovopay://payment?order_id=${orderId}&amount=${amount}`,
      dana: `dana://pay?order_id=${orderId}&amount=${amount}`,
    };
    
    return links[provider as keyof typeof links] || '#';
  }

  // Create self-payment transaction
  async createSelfPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const { id_order, id_user, total_bayar, metode_pembayaran, payment_type, payment_details } = paymentRequest;

      // Get payment method to get the correct database value
      const method = this.getPaymentMethodById(payment_details?.provider || 'qris');
      const dbPaymentMethod = method?.value || metode_pembayaran;

      // Create transaction with 'pending' status
      const transaksiData = {
        id_user,
        id_order,
        tanggal: new Date().toISOString().split('T')[0],
        total_bayar,
        uang_diterima: total_bayar,
        kembalian: 0,
        metode_pembayaran: dbPaymentMethod, // Use database-compatible value (tunai/debit/qris)
        // status_pembayaran: 'pending', // Uncomment after adding column
        // payment_details: payment_details || {}, // Uncomment after adding column
      };

      const { data: transaksi, error } = await supabase
        .from('transaksi')
        .insert(transaksiData)
        .select()
        .single();

      if (error) throw error;

      // Generate payment information based on type
      let payment_info: PaymentResponse['payment_info'] = {
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      switch (payment_type) {
        case 'qris':
          payment_info.qr_code = this.generateQRCode(id_order, total_bayar);
          break;
        
        case 'ewallet':
          if (payment_details?.provider) {
            payment_info.deep_link = this.generateDeepLink(
              payment_details.provider,
              id_order,
              total_bayar
            );
          }
          payment_info.qr_code = this.generateQRCode(id_order, total_bayar); // E-wallet juga bisa scan QR
          break;
        
        case 'bank_transfer':
          if (payment_details?.provider) {
            payment_info.virtual_account = this.generateVirtualAccount(
              payment_details.provider,
              id_order
            );
          }
          break;
      }

      return {
        success: true,
        message: 'Transaksi pembayaran berhasil dibuat',
        transaksi,
        payment_info,
      };
    } catch (error: any) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        message: error.message || 'Gagal membuat transaksi pembayaran',
      };
    }
  }

  // Confirm payment (manual confirmation for demo)
  async confirmPayment(id_transaksi: number): Promise<PaymentResponse> {
    try {
      // Fetch transaction first
      const { data: existingTrans, error: fetchError } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id_transaksi', id_transaksi)
        .single();

      if (fetchError) throw fetchError;

      // For now, just update order status since status_pembayaran column might not exist
      await supabase
        .from('order')
        .update({ status_order: 'selesai' })
        .eq('id_order', existingTrans.id_order);

      return {
        success: true,
        message: 'Pembayaran berhasil dikonfirmasi',
        transaksi: existingTrans,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Gagal konfirmasi pembayaran',
      };
    }
  }

  // Check payment status (for auto-refresh in UI)
  async checkPaymentStatus(id_transaksi: number) {
    try {
      const { data, error } = await supabase
        .from('transaksi')
        .select('*, order(*)')
        .eq('id_transaksi', id_transaksi)
        .single();

      if (error) throw error;

      return {
        success: true,
        status: 'pending', // Default to pending if status_pembayaran column doesn't exist
        transaksi: data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Get payment methods
  getPaymentMethods(): PaymentMethod[] {
    return PAYMENT_METHODS;
  }

  // Get payment method by ID
  getPaymentMethodById(id: string): PaymentMethod | undefined {
    return PAYMENT_METHODS.find(method => method.id === id);
  }
}

export const paymentService = new PaymentService();