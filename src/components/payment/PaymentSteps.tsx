// src/components/payment/PaymentSteps.tsx
'use client';

import { Check } from 'lucide-react';

interface PaymentStepsProps {
  currentStep: number;
}

export default function PaymentSteps({ currentStep }: PaymentStepsProps) {
  const steps = [
    { id: 1, label: 'ORDER' },
    { id: 2, label: 'PAYMENT' },
    { id: 3, label: 'SUCCESSFULLY' },
  ];

  // Logic lebar garis biru (Active): 
  // Step 1 (Order) = 0%
  // Step 2 (Payment) = 50%
  // Step 3 (Successfully) = 100%
  const progressWidth = currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%';

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 py-4">
      {/* 1. Baris Label (Teks) */}
      <div className="flex justify-between mb-3 px-2">
        {steps.map((step) => {
          const isActive = step.id <= currentStep;
          return (
            <span
              key={step.id}
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest w-24 text-center transition-colors duration-300
                ${isActive ? 'text-black dark:text-white' : 'text-neutral-400'}
              `}
            >
              {step.label}
            </span>
          );
        })}
      </div>

      {/* 2. Baris Indikator (Lingkaran & Garis) */}
      <div className="relative flex justify-between items-center px-10"> {/* Padding container utama */}

        {/* --- GARIS TIMELINE (Background & Active) --- */}
        {/* FIX: Hapus -z-10, gunakan absolute top-1/2 */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 px-12">
          {/* Container Garis Abu-abu (Background) */}
          <div className="w-full h-[3px] bg-neutral-200 dark:bg-neutral-800 rounded-full relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-black dark:bg-white transition-all duration-700 ease-in-out rounded-full"
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        {/* --- LINGKARAN STEPS --- */}
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              // FIX: Pastikan bg-white/bg-black ada untuk menutupi garis di belakangnya
              className={`w-6 h-6 rounded-full flex items-center justify-center border-[2px] transition-all duration-500 z-10 
                ${isCompleted || isCurrent
                  ? 'border-black dark:border-white bg-white dark:bg-black'
                  : 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800'
                }`}
            >
              {isCompleted ? (
                // Icon Ceklis (Step sudah lewat)
                <div className="w-full h-full bg-black dark:bg-white rounded-full flex items-center justify-center animate-scale-in">
                  <Check className="w-3.5 h-3.5 text-white dark:text-black stroke-[3]" />
                </div>
              ) : isCurrent ? (
                <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-full animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-transparent" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}