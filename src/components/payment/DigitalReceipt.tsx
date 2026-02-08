// src/components/payment/DigitalReceipt.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { Download, CheckCircle, Coffee, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';

interface DigitalReceiptProps {
  transaksi: any;
  onClose: () => void;
}

export default function DigitalReceipt({ transaksi, onClose }: DigitalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // 1. Generate ID Unik untuk Barcode
  const dateObj = new Date(transaksi.tanggal);
  const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
  const receiptCode = `${dateStr}${transaksi.id_transaksi.toString().padStart(4, '0')}`;

  // 2. Hitung Ulang Subtotal & Pajak
  const items = transaksi.order?.detail_order || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const tax = subtotal * 0.10; // Pajak 10%

  // 3. LOGIKA PERBAIKAN TIPE PESANAN
  // Cek berbagai kondisi untuk memastikan tipe pesanan yang benar
  const orderData = transaksi.order;
  const noMeja = orderData?.no_meja?.toString().toUpperCase() || '';
  const tipePesanan = orderData?.tipe_pesanan?.toString().toLowerCase() || '';
  
  // Tentukan apakah Take Away berdasarkan beberapa kondisi:
  // 1. tipe_pesanan adalah 'take_away' atau 'takeaway'
  // 2. no_meja adalah 'TAKE_AWAY', 'TAKEAWAY', atau 'TA'
  // 3. no_meja kosong/null
  const isTakeAway = 
    tipePesanan === 'take_away' || 
    tipePesanan === 'takeaway' ||
    noMeja === 'TAKE_AWAY' || 
    noMeja === 'TAKEAWAY' ||
    noMeja === 'TA' ||
    noMeja === '' ||
    !noMeja;

  const displayType = isTakeAway ? 'TAKE AWAY' : 'DINE IN';
  const tableNumber = isTakeAway ? null : noMeja;

  // Debug log untuk melihat data yang masuk
  useEffect(() => {
    console.log('=== DEBUG RECEIPT ===');
    console.log('tipe_pesanan:', tipePesanan);
    console.log('no_meja:', noMeja);
    console.log('isTakeAway:', isTakeAway);
    console.log('displayType:', displayType);
    console.log('tableNumber:', tableNumber);
  }, [tipePesanan, noMeja, isTakeAway]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Struk-${receiptCode}.pdf`);

    } catch (error) {
      console.error('Gagal PDF:', error);
      alert('Gagal cetak PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto animate-slide-up pb-10">

      {/* AREA STRUK */}
      <div
        ref={receiptRef}
        className="bg-white text-black w-full shadow-2xl relative overflow-hidden font-mono text-sm"
        style={{
          fontFamily: "'Courier Prime', 'Courier New', monospace",
          width: '100%',
        }}
      >

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center">
                <Coffee className="w-6 h-6 text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-1">CAFFEEIN</h2>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Authentic and Modern Coffee Shop</p>
            <div className="my-3 border-b border-black border-dashed"></div>
            <p className="text-[11px] font-bold">Jl. Dharma Bakti No. 14</p>
            <p className="text-[11px]">Pandaan, Jawa Timur</p>
          </div>

          {/* Info Transaksi */}
          <div className="mb-2 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-500">Date</span>
              <span>{new Date(transaksi.tanggal).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Order ID</span>
              <span className="font-bold">#{transaksi.id_transaksi}</span>
            </div>
            
            {/* TIPE ORDER (Sudah Diperbaiki) */}
            <div className="flex justify-between">
               <span className="text-neutral-500">Type</span>
               <span className="font-bold uppercase">{displayType}</span>
            </div>
            
            {/* Hanya tampilkan Meja jika BUKAN Take Away */}
            {!isTakeAway && tableNumber && (
                <div className="flex justify-between">
                    <span className="text-neutral-500">Table</span>
                    <span className="font-bold">#{tableNumber}</span>
                </div>
            )}

            <div className="flex justify-between border-t border-dashed border-neutral-300 pt-2 mt-2">
              <span className="text-neutral-500">Customer</span>
              <span className="font-bold uppercase text-sm">{transaksi.order?.nama_pelanggan || 'GUEST'}</span>
            </div>
          </div>

          <div className="border-b border-black mb-6"></div>

          {/* List Menu */}
          <div className="space-y-3 mb-6">
            {items.map((item: any, index: number) => (
              <div key={index} className="flex flex-col text-xs">
                <span className="font-bold mb-1 text-[13px]">{item.masakan?.nama_masakan}</span>
                <div className="flex justify-between text-neutral-600 pl-2">
                  <span>{item.jumlah} x {item.harga_satuan.toLocaleString('id-ID')}</span>
                  <span className="text-black font-bold">{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-b border-black border-dashed mb-4"></div>

          {/* Total & Tax Section */}
          <div className="space-y-1 mb-6">
            <div className="flex justify-between text-[11px]">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between text-[11px] text-neutral-600">
              <span>Tax & Service (10%)</span>
              <span>Rp {tax.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between text-lg font-black pt-2 pb-2 border-t border-black items-center">
              <span>TOTAL</span>
              <span>Rp {transaksi.total_bayar.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs mt-6 items-center bg-neutral-100 p-2 rounded">
              <span className="font-bold">PAYMENT</span>
              <span className="uppercase font-bold">{transaksi.metode_pembayaran}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] space-y-6 mt-8">
            <div className="flex justify-center items-center gap-2 text-neutral-500 mb-4">
              <CheckCircle className="w-4 h-4 text-black" />
              <span className="font-bold text-black">PAID / LUNAS</span>
            </div>

            {/* QR CODE */}
            <div className="flex flex-col items-center">
              {currentUrl && (
                <div className="p-2 border border-neutral-300 rounded bg-white">
                  <QRCode
                    value={currentUrl}
                    size={100}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>
              )}
              <p className="text-[10px] mt-2 text-neutral-500">Scan untuk simpan struk</p>
            </div>

            {/* BARCODE */}
            <div className="flex flex-col items-center justify-center opacity-80 pt-4 border-t border-dashed border-neutral-300 w-full">
              <Barcode
                value={receiptCode}
                format="CODE128"
                width={2}
                height={40}
                displayValue={true}
                font="monospace"
                textAlign="center"
                fontSize={10}
                background="transparent"
                lineColor="#000000"
                margin={0}
              />
            </div>

            <p className="text-[10px] text-neutral-400">Terima kasih atas kunjungan Anda!</p>
          </div>
        </div>

      </div>

      {/* BUTTONS */}
      <div className="flex flex-col w-full gap-3">
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="bg-neutral-800 hover:bg-neutral-200 text-black border-none h-12 flex items-center justify-center"
        >
          {isDownloading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          <span className="text-xs sm:text-sm">Cetak Struk</span>
        </Button>

        <Button
          variant="outline"
          onClick={onClose}
          className="w-full border border-neutral-200 dark:border-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 bg-transparent h-12 flex items-center justify-center"
        >
          <Home className="w-4 h-4 mr-2" />
          <span className="text-xs sm:text-sm">Menu Utama</span>
        </Button>
      </div>

    </div>
  );
}