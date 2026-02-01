// src/lib/services/paymentService.ts
import { supabase } from '@/lib/supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'qris' | 'ewallet' | 'bank_transfer';
  icon: string; // Path ke file gambar
  value: string;
  instructions: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  transaksi?: any;
  payment_info?: {
    qr_code?: string;
    virtual_account?: string;
    account_name?: string;
    amount?: number;
    expires_at?: string;
  };
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  // 1. QRIS
  {
    id: 'qris',
    name: 'QRIS',
    type: 'qris',
    value: 'qris',
    icon: '/images/icons/qris.jpeg',
    instructions: 'Scan QR menggunakan aplikasi E-Wallet atau Mobile Banking.',
  },
  // 2. E-Wallet
  {
    id: 'dana',
    name: 'DANA',
    type: 'ewallet',
    value: 'qris',
    icon: '/images/icons/dana.png',
    instructions: 'Scan QR atau transfer ke nomor yang tertera.',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    type: 'ewallet',
    value: 'qris',
    icon: '/images/icons/shopeepay.png',
    instructions: 'Scan QR atau transfer ke nomor yang tertera.',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'ewallet',
    value: 'qris',
    icon: '/images/icons/gopay.png',
    instructions: 'Scan QR atau transfer ke nomor yang tertera.',
  },
  {
    id: 'ovo',
    name: 'OVO',
    type: 'ewallet',
    value: 'qris',
    icon: '/images/icons/ovo.png',
    instructions: 'Scan QR atau transfer ke nomor yang tertera.',
  },
  
  // 3. Bank Transfer
  {
    id: 'bca',
    name: 'BCA Virtual Account',
    type: 'bank_transfer',
    value: 'debit',
    icon: '/images/icons/bca.png',
    instructions: 'Transfer ke Nomor Virtual Account BCA di bawah ini.',
  },
  {
    id: 'mandiri',
    name: 'Mandiri Virtual Account',
    type: 'bank_transfer',
    value: 'debit',
    icon: '/images/icons/mandiri.png',
    instructions: 'Transfer ke Nomor Virtual Account Mandiri di bawah ini.',
  },
  {
    id: 'bri',
    name: 'BRI Virtual Account',
    type: 'bank_transfer',
    value: 'debit',
    icon: '/images/icons/bri.png',
    instructions: 'Transfer ke Nomor Virtual Account BRI di bawah ini.',
  },
  {
    id: 'bni',
    name: 'BNI Virtual Account',
    type: 'bank_transfer',
    value: 'debit',
    icon: '/images/icons/bni.png',
    instructions: 'Transfer ke Nomor Virtual Account BRI di bawah ini.',
  },
];

class PaymentService {
  private generateQRCode(data: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  }

  private generatePaymentNumber(provider: string, orderId: number): string {
    const prefixMap: Record<string, string> = {
      bca: '8800',
      mandiri: '9001',
      bri: '7711',
      bni: '6521',
      dana: '0814',
      shopeepay: '0815',
      gopay: '0812',
      ovo: '0813',
    };
    const prefix = prefixMap[provider] || '9999';
    const suffix = orderId.toString().padStart(6, '0').slice(-6); 
    return `${prefix}88${suffix}`; 
  }

  getPaymentMethodById(id: string) {
    return PAYMENT_METHODS.find((m) => m.id === id);
  }

  async createSelfPayment(params: {
    id_order: number;
    id_user: number | null;
    total_bayar: number;
    metode_pembayaran: string; 
    payment_details: { provider: string };
  }): Promise<PaymentResponse> {
    try {
      const { id_order, id_user, total_bayar, metode_pembayaran, payment_details } = params;
      const provider = payment_details.provider;
      const methodType = PAYMENT_METHODS.find(m => m.id === provider)?.type;

      const { data: transaksi, error } = await supabase
        .from('transaksi')
        .insert([{
          id_user,
          id_order,
          tanggal: new Date().toISOString(),
          total_bayar,
          uang_diterima: total_bayar, 
          kembalian: 0,
          metode_pembayaran 
        }])
        .select()
        .single();

      if (error) throw error;

      const paymentInfo: any = {
        amount: total_bayar,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), 
      };

      if (methodType === 'qris') {
        const qrContent = `CAFFEEIN-ORDER-${id_order}-RP${total_bayar}`;
        paymentInfo.qr_code = this.generateQRCode(qrContent);
      } 
      else if (methodType === 'ewallet') {
        const qrContent = `EW-${provider.toUpperCase()}-${id_order}`;
        paymentInfo.qr_code = this.generateQRCode(qrContent);
        paymentInfo.virtual_account = this.generatePaymentNumber(provider, id_order); 
      } 
      else if (methodType === 'bank_transfer') {
        paymentInfo.virtual_account = this.generatePaymentNumber(provider, id_order);
        paymentInfo.account_name = 'CAFFEEIN MERCHANTS';
      }

      return {
        success: true,
        message: 'Transaksi dibuat',
        transaksi,
        payment_info: paymentInfo
      };

    } catch (error: any) {
      console.error('Payment Service Error:', error);
      return { success: false, message: error.message };
    }
  }
}

export const paymentService = new PaymentService();