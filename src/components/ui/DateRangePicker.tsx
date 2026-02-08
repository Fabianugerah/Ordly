'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date, end: Date | null) => void;
  className?: string;
}

export default function DateRangePicker({ startDate, endDate, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sinkronisasi bulan kalender dengan tanggal yang dipilih saat dibuka
  useEffect(() => {
    if (isOpen && startDate) {
      setCurrentMonth(new Date(startDate));
    }
  }, [isOpen, startDate]);

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Padding hari kosong di awal bulan
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Tanggal-tanggal
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Mulai seleksi baru
      onChange(date, null);
      setHoverDate(null);
    } else {
      // Selesaikan seleksi range
      if (date < startDate) {
        onChange(date, startDate); // Jika klik tanggal sebelum start, tukar posisi
        setIsOpen(false);
      } else {
        onChange(startDate, date);
        setIsOpen(false);
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!startDate) return false;
    
    const end = endDate || hoverDate;
    if (!end) return false; // Hanya start date yang dipilih

    const start = startDate < end ? startDate : end;
    const finish = startDate < end ? end : startDate;

    // Set time ke 0 agar perbandingan akurat
    const dTime = date.setHours(0,0,0,0);
    const sTime = start.setHours(0,0,0,0);
    const fTime = finish.setHours(0,0,0,0);

    return dTime > sTime && dTime < fTime;
  };

  const isSelected = (date: Date) => {
    if (!date) return false;
    const dTime = date.setHours(0,0,0,0);
    const sTime = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
    const eTime = endDate ? new Date(endDate).setHours(0,0,0,0) : null;
    return dTime === sTime || dTime === eTime;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={`relative w-full sm:w-auto ${className}`} ref={containerRef}>
      {/* Trigger Button - Style disamakan dengan SingleDatePicker */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-80 flex items-center justify-between gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900 min-w-[200px]"
      >
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
          <CalendarIcon className="w-5 h-5 text-neutral-400" />
          <span className="text-sm font-medium">
            {startDate 
              ? `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : '...'}`
              : 'Pilih Periode'}
          </span>
        </div>
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute top-full mt-4 left-0 z-50 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 w-[600px] animate-in fade-in zoom-in-95 duration-100 origin-top-left flex flex-col md:flex-row gap-6 overflow-hidden">
            {/* Render 2 Bulan (Bulan Ini & Bulan Depan) */}
            {[0, 1].map((offset) => {
              const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
              const days = getDaysInMonth(displayMonth.getFullYear(), displayMonth.getMonth());

              return (
                <div key={offset} className="flex-1">
                  {/* Header Bulan */}
                  <div className="flex items-center justify-between mb-4">
                    {offset === 0 ? (
                      <button 
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    ) : <div className="w-9" />} {/* Spacer width p-2 + w-5 */}

                    <span className="font-bold text-neutral-900 dark:text-white text-sm">
                      {months[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                    </span>

                    {offset === 1 ? (
                      <button 
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    ) : <div className="w-9" />} {/* Spacer */}
                  </div>

                  {/* Nama Hari */}
                  <div className="grid grid-cols-7 mb-2 text-center">
                    {daysOfWeek.map(day => (
                      <div key={day} className="text-xs font-medium text-neutral-500 dark:text-neutral-500 py-1">{day}</div>
                    ))}
                  </div>

                  {/* Grid Tanggal */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((date, idx) => {
                      if (!date) return <div key={idx} />; // Slot kosong

                      const isSelectedDate = isSelected(date);
                      const isRangeDate = isInRange(date);
                      const isStart = startDate && date.toDateString() === startDate.toDateString();
                      const isEnd = endDate && date.toDateString() === endDate.toDateString();

                      return (
                        <button
                          key={idx}
                          onClick={() => handleDateClick(date)}
                          onMouseEnter={() => !endDate && startDate && setHoverDate(date)}
                          onMouseLeave={() => setHoverDate(null)}
                          className={`
                            h-8 w-full flex items-center justify-center text-sm font-medium transition-all
                            ${isStart ? 'bg-orange-500 text-white rounded-l-md z-10' : ''}
                            ${isEnd ? 'bg-orange-500 text-white rounded-r-md z-10' : ''}
                            ${!isStart && !isEnd && isRangeDate 
                                ? 'bg-blue-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' 
                                : ''}
                            ${!isStart && !isEnd && !isRangeDate 
                                ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md' 
                                : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}