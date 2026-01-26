'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function SuccessModal({ isOpen, onClose, message }: SuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="" // Title kosong karena kita pakai custom layout
    >
      {/* Container dengan Animasi Masuk (Zoom & Slide) */}
      <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
        
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-200 dark:border-green-800">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
          Berhasil!
        </h3>
        
        <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-xs leading-relaxed">
          {message}
        </p>
        
        <Button 
          onClick={onClose} 
          className="w-full transition-transform active:scale-95 shadow-md hover:shadow-lg" // Efek tekan & shadow
        >
          Tutup
        </Button>
      </div>
    </Modal>
  );
}