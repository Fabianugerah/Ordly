'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

interface SingleDatePickerProps {
  date: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}

export default function SingleDatePicker({ date, onChange, className = '' }: SingleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Sinkronisasi bulan saat tanggal dipilih dari luar
  useEffect(() => {
    if (date) {
      setCurrentMonth(new Date(date));
    }
  }, [date]);

  // Tutup saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handleDateClick = (selectedDate: Date) => {
    onChange(selectedDate);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full sm:w-auto ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-64 flex items-center justify-between gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[200px]"
      >
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
          <Calendar className="w-5 h-5 text-neutral-400" />
          <span className="text-sm font-medium">
            {date
              ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Filter Tanggal'}
          </span>
        </div>
        {date && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-4 left-0 z-50 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 min-w-[320px] animate-in fade-in zoom-in-95 duration-100 origin-top-left">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-900 dark:text-white" />
            </button>
            <span className="font-bold text-neutral-900 dark:text-white">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-neutral-900 dark:text-white" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((d, i) => {
              if (!d) return <div key={`empty-${i}`} className="aspect-square" />;
              
              const isSelected = date && d.toDateString() === date.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(d)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all 
                    ${isSelected
                      ? 'bg-orange-500 text-white shadow-md'
                      : isToday
                      ? 'bg-blue-50 dark:bg-orange-900/20 text-orange-500 border border-orange-500'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}