// src/components/payment/DigitalReceipt.tsx
'use client';

import { useRef } from 'react';
import { CheckCircle, Download, Share2, Printer } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ReceiptProps {
  transaksi: {
    id_transaksi: number;
    tanggal: string;
    total_bayar: number;
    metode_pembayaran: string;
    created_at?: string;
    order?: {
      id_order: number;
      no_meja: string;
      detail_order?: Array<{
        masakan?: { nama_masakan: string };
        jumlah: number;
        harga_satuan: number;
        subtotal: number;
      }>;
    };
  };
  onClose?: () => void;
}

export default function DigitalReceipt({ transaksi, onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // In production, use html2canvas or similar library
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Struk Pembayaran CaffeeIn',
          text: `Pembayaran berhasil - Order #${transaksi.order?.id_order}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Pembayaran Berhasil!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Terima kasih atas pembayaran Anda
          </p>
        </div>

        {/* Receipt Card */}
        <div
          ref={receiptRef}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-neutral-800"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">CaffeeIn</h2>
              <p className="text-orange-100 text-sm">Restaurant & Cafe</p>
              <div className="mt-4 pt-4 border-t border-orange-400/30">
                <p className="text-sm">Struk Pembayaran Digital</p>
              </div>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="px-8 py-6 space-y-6">
            {/* Transaction Info */}
            <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">No. Transaksi</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  #{transaksi.id_transaksi}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">No. Order</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  #{transaksi.order?.id_order}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Meja</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {transaksi.order?.no_meja}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tanggal & Waktu</span>
                <span className="font-semibold text-gray-900 dark:text-white text-right">
                  {formatDate(transaksi.created_at || transaksi.tanggal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Metode Pembayaran</span>
                <span className="font-semibold text-gray-900 dark:text-white uppercase">
                  {transaksi.metode_pembayaran}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Rincian Pesanan</h3>
              <div className="space-y-2">
                {transaksi.order?.detail_order?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
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
            </div>

            {/* Total */}
            <div className="pt-6 border-t-2 border-dashed border-gray-300 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Total Pembayaran
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  Rp {transaksi.total_bayar.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">LUNAS</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Pembayaran telah diterima
              </p>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-neutral-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Terima kasih atas kunjungan Anda
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Simpan struk ini sebagai bukti pembayaran
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-900"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-900"
            >
              <Share2 className="w-4 h-4" />
              Bagikan
            </Button>
          </div>
          
          {onClose && (
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Kembali ke Dashboard
            </Button>
          )}
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content,
            .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}