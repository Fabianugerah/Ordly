// src/app/guest/payment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  ArrowLeft,
  Smartphone,
  Wallet,
  Building2,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { paymentService, PAYMENT_METHODS } from '@/lib/services/paymentService';
import Image from 'next/image';

export default function CustomerPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const [order, setOrder] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (orderId) {
      fetchOrderDetails(parseInt(orderId));
    } else {
      router.push('/guest/orders');
    }
  }, [searchParams]);

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order')
        .select(`
          *,
          detail_order(*, masakan(*))
        `)
        .eq('id_order', orderId)
        .single();

      if (error) throw error;

      // Check if already paid
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id_order', orderId)
        .single();

      if (transaksi) {
        // Already paid, redirect to receipt
        router.push(`/guest/receipt?transaksi=${transaksi.id_transaksi}`);
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Gagal memuat detail pesanan');
      router.push('/guest/orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert('Silakan pilih metode pembayaran');
      return;
    }

    const method = paymentService.getPaymentMethodById(selectedMethod);
    if (!method) return;

    setProcessing(true);

    try {
      const response = await paymentService.createSelfPayment({
        id_order: order.id_order,
        id_user: user?.id_user!,
        total_bayar: order.total_harga,
        metode_pembayaran: method.value, // Use database-compatible value
        payment_type: method.type,
        payment_details: {
          provider: selectedMethod,
        },
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      setPaymentInfo(response.payment_info);

      // Auto-redirect to receipt after 3 seconds for demo
      // In production, wait for actual payment confirmation
      setTimeout(() => {
        router.push(`/guest/receipt?transaksi=${response.transaksi.id_transaksi}`);
      }, 3000);

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'qris':
        return <QrCode className="w-6 h-6" />;
      case 'ewallet':
        return <Wallet className="w-6 h-6" />;
      case 'bank_transfer':
        return <Building2 className="w-6 h-6" />;
      default:
        return <Smartphone className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (

      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>

    );
  }

  if (!order) {
    return null;
  }

  return (

    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/guest/orders')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Pembayaran
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Order #{order.id_order} - Meja {order.no_meja}
          </p>
        </div>
      </div>

      {/* Payment Info Display (if processing) */}
      {paymentInfo && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Menunggu Pembayaran
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Silakan lakukan pembayaran sesuai instruksi di bawah
              </p>
            </div>

            {/* QRIS QR Code */}
            {paymentInfo.qr_code && (
              <div className="bg-white p-6 rounded-xl inline-block">
                <Image
                  src={paymentInfo.qr_code}
                  alt="QR Code"
                  width={300}
                  height={300}
                  className="rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Scan QR code dengan aplikasi pembayaran Anda
                </p>
              </div>
            )}

            {/* Virtual Account */}
            {paymentInfo.virtual_account && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Nomor Virtual Account
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                    {paymentInfo.virtual_account}
                  </span>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.virtual_account)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* E-wallet Deep Link */}
            {paymentInfo.deep_link && (
              <Button
                onClick={() => window.location.href = paymentInfo.deep_link}
                className="w-full max-w-xs"
              >
                Buka Aplikasi Pembayaran
              </Button>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pembayaran akan otomatis terkonfirmasi setelah kami menerima pembayaran Anda
            </p>
          </div>
        </Card>
      )}

      {/* Payment Methods Selection (if not processing) */}
      {!paymentInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Pilih Metode Pembayaran">
              <div className="space-y-4">
                {/* QRIS */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Scan QR
                  </h3>
                  <div className="grid gap-3">
                    {PAYMENT_METHODS.filter(m => m.type === 'qris').map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === method.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{method.icon}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {method.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {method.instructions}
                            </p>
                          </div>
                          {selectedMethod === method.id && (
                            <CheckCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* E-Wallet */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    E-Wallet
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PAYMENT_METHODS.filter(m => m.type === 'ewallet').map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${selectedMethod === method.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{method.icon}</div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {method.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Transfer */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Transfer Bank
                  </h3>
                  <div className="grid gap-3">
                    {PAYMENT_METHODS.filter(m => m.type === 'bank_transfer').map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === method.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{method.icon}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {method.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {method.instructions}
                            </p>
                          </div>
                          {selectedMethod === method.id && (
                            <CheckCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card title="Ringkasan Pesanan">
              <div className="space-y-4">
                <div className="space-y-2">
                  {order.detail_order?.map((item: any) => (
                    <div key={item.id_detail_order} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.masakan?.nama_masakan}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {item.jumlah} x Rp {item.harga_satuan.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      Rp {order.total_harga.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={!selectedMethod || processing}
                    className="w-full"
                  >
                    {processing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </div>
                    ) : (
                      'Bayar Sekarang'
                    )}
                  </Button>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      Setelah memilih metode pembayaran, Anda akan mendapatkan instruksi untuk menyelesaikan pembayaran.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>

  );
}