'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select'; // Menggunakan komponen Select
import {
  Receipt, Search, Eye, CreditCard, Banknote, Smartphone, RefreshCw,
  Calendar, ChevronLeft, ChevronRight, XCircle, MoreVertical, Printer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Opsi Filter Metode Pembayaran
const PAYMENT_OPTIONS = [
  { value: 'Semua', label: 'Semua Metode' },
  { value: 'Tunai', label: 'Tunai' },
  { value: 'Debit', label: 'Debit' },
  { value: 'QRIS', label: 'QRIS' },
];

export default function AdminTransaksiPage() {
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState<any[]>([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Semua');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Date Picker State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Action Menu State (Kebab Menu)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  useEffect(() => { fetchTransaksi(); }, []);
  useEffect(() => { filterTransaksi(); }, [search, metodeBayar, selectedDate, transaksi]);
  
  // Close Date Picker & Action Menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Date Picker Logic
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      // Action Menu Logic
      if (openMenuId !== null && !(event.target as Element).closest('.action-menu-trigger')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker, openMenuId]);

  const fetchTransaksi = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi')
        .select(`
          *,
          users:id_user(nama_user, username, level(nama_level)),
          order:id_order(
            no_meja,
            tanggal,
            status_order,
            detail_order(
              *,
              masakan(nama_masakan, kategori)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransaksi(data || []);
      setFilteredTransaksi(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTransaksi = () => {
    let filtered = [...transaksi];
    if (search) {
      filtered = filtered.filter(t =>
        t.id_transaksi.toString().includes(search) ||
        t.order?.no_meja.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (metodeBayar !== 'Semua') {
      filtered = filtered.filter(t => t.metode_pembayaran === metodeBayar.toLowerCase());
    }
    if (selectedDate) {
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(selectedDate);
      filtered = filtered.filter(t => t.tanggal === dateStr);
    }
    setFilteredTransaksi(filtered);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day));
    return days;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const getPaymentIcon = (metode: string) => {
    const icons = { tunai: Banknote, debit: CreditCard, qris: Smartphone };
    const Icon = icons[metode.toLowerCase() as keyof typeof icons] || Receipt;
    return <Icon className="w-3.5 h-3.5" />;
  };

  const getPaymentBadge = (metode: string) => {
    const styles = {
      tunai: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      debit: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      qris: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    };
    return styles[metode.toLowerCase() as keyof typeof styles] || 'bg-neutral-100 text-neutral-800';
  };

  const stats = {
    total: transaksi.length,
    totalPendapatan: transaksi.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0),
    tunai: transaksi.filter(t => t.metode_pembayaran === 'tunai').length,
    debit: transaksi.filter(t => t.metode_pembayaran === 'debit').length,
    qris: transaksi.filter(t => t.metode_pembayaran === 'qris').length,
    hariIni: transaksi.filter(t => t.tanggal === new Date().toISOString().split('T')[0]).length,
  };

  if (loading) return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Riwayat Transaksi</h1>
            <p className="text-neutral-600 mt-1">Kelola dan monitor semua transaksi pembayaran</p>
          </div>
          <Button onClick={fetchTransaksi} variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <RefreshCw className="w-5 h-5" /> Refresh
          </Button>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-neutral-800 dark:text-white' },
            { label: 'Revenue', value: `Rp ${(stats.totalPendapatan / 1000000).toFixed(1)}jt`, color: 'text-green-600' },
            { label: 'Hari Ini', value: stats.hariIni, color: 'text-blue-600' },
            { label: 'Tunai', value: stats.tunai, color: 'text-green-600', icon: Banknote },
            { label: 'Debit', value: stats.debit, color: 'text-blue-600', icon: CreditCard },
            { label: 'QRIS', value: stats.qris, color: 'text-purple-600', icon: Smartphone }
          ].map((stat, i) => (
            <Card key={i} className="text-center p-4">
              {stat.icon && <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2 opacity-80`} />}
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* --- Filters Section --- */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari ID transaksi atau meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Date Picker (Left-aligned dropdown) */}
                <div className="relative w-full sm:w-auto" ref={datePickerRef}>
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full sm:w-64 flex items-center justify-between gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[200px]"
                  >
                    <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
                        <Calendar className="w-5 h-5 text-neutral-400" />
                        <span className="text-sm font-medium">
                          {selectedDate ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Filter Tanggal'}
                        </span>
                    </div>
                    {selectedDate && (
                      <div
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }}
                        className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  {showDatePicker && (
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
                        {daysOfWeek.map(day => (
                          <div key={day} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentMonth).map((date, i) => {
                          if (!date) return <div key={`e-${i}`} className="aspect-square" />;
                          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                          const isToday = date.toDateString() === new Date().toDateString();
                          return (
                            <button
                              key={i}
                              onClick={() => handleDateClick(date)}
                              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-orange-500 text-white shadow-md'
                                  : isToday
                                  ? 'bg-blue-50 dark:bg-orange-900/20 text-orange-500 border border-orange-500'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metode Pembayaran Dropdown (Menggantikan tombol) */}
                <div className="w-full sm:w-48">
                    <Select
                        options={PAYMENT_OPTIONS}
                        value={metodeBayar}
                        onChange={(e) => setMetodeBayar(e.target.value)}
                        className="!bg-neutral-50 dark:!bg-neutral-800 !py-2.5"
                    />
                </div>
            </div>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  {['ID', 'Tanggal', 'Order ID', 'Meja', 'Kasir', 'Metode', 'Total', 'Aksi'].map(h => (
                    <th key={h} className={`px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider ${h === 'Aksi' ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredTransaksi.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-2" />
                        <p>Tidak ada transaksi ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransaksi.map(t => (
                    <tr key={t.id_transaksi} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                        #{t.id_transaksi}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        #{t.id_order}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-white">
                        Meja {t.order?.no_meja || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {t.users?.nama_user || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentBadge(t.metode_pembayaran)}`}>
                          {getPaymentIcon(t.metode_pembayaran)}
                          <span className="uppercase tracking-wide">{t.metode_pembayaran}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600 tabular-nums">
                        Rp {parseFloat(t.total_bayar).toLocaleString('id-ID')}
                      </td>
                      
                      {/* --- Action Menu (Kebab) --- */}
                      <td className="px-6 py-4 text-center relative">
                        <div className="relative inline-block action-menu-trigger">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === t.id_transaksi ? null : t.id_transaksi);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                    openMenuId === t.id_transaksi 
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' 
                                    : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {openMenuId === t.id_transaksi && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTransaksi(t);
                                            setShowDetailModal(true);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                                    >
                                        <Eye className="w-4 h-4 text-blue-500" /> 
                                        Lihat Detail
                                    </button>
                                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2"></div>
                                    <button
                                        onClick={() => {
                                           // Logika cetak struk bisa ditambahkan di sini
                                           alert("Fitur cetak struk sedang diproses...");
                                           setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                                    >
                                        <Printer className="w-4 h-4 text-neutral-500" /> 
                                        Cetak Struk
                                    </button>
                                </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Detail Modal --- */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaksi(null);
          }}
          title={`Detail Transaksi #${selectedTransaksi?.id_transaksi}`}
        >
          {selectedTransaksi && (
            <div className="space-y-6">
              {/* Header Info Card */}
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-800/50 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-green-600 tabular-nums">
                    Rp {parseFloat(selectedTransaksi.total_bayar).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-neutral-200 dark:divide-neutral-700">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Diterima</p>
                    <p className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                      Rp {selectedTransaksi.uang_diterima ? parseFloat(selectedTransaksi.uang_diterima).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Kembalian</p>
                    <p className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                      Rp {selectedTransaksi.kembalian ? parseFloat(selectedTransaksi.kembalian).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Metode</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getPaymentBadge(selectedTransaksi.metode_pembayaran)}`}>
                      {selectedTransaksi.metode_pembayaran}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Info Details */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 pb-6 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">ID Transaksi</p>
                  <p className="font-medium text-neutral-900 dark:text-white">#{selectedTransaksi.id_transaksi}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">ID Order</p>
                  <p className="font-medium text-neutral-900 dark:text-white">#{selectedTransaksi.id_order}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Tanggal</p>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {new Date(selectedTransaksi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Posisi</p>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    Meja {selectedTransaksi.order?.no_meja || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Kasir</p>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {selectedTransaksi.users?.nama_user || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Role</p>
                  <p className="font-medium capitalize text-neutral-900 dark:text-white">
                    {selectedTransaksi.users?.level?.nama_level || '-'}
                  </p>
                </div>
              </div>

              {/* Item List */}
              <div>
                <h4 className="font-semibold mb-3 text-neutral-900 dark:text-white">Rincian Pesanan</h4>
                <div className="space-y-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedTransaksi.order?.detail_order?.map((detail: any) => (
                    <div key={detail.id_detail_order} className="flex justify-between items-center p-3 bg-white dark:bg-neutral-800 rounded border border-neutral-100 dark:border-neutral-700 shadow-sm">
                      <div>
                        <p className="font-medium text-sm text-neutral-900 dark:text-white">{detail.masakan?.nama_masakan}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {detail.jumlah} x Rp {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                          </p>
                          {detail.masakan?.kategori && (
                            <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-[10px] rounded">
                              {detail.masakan.kategori}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-neutral-900 dark:text-white tabular-nums">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2">
                <Button className="w-full flex items-center justify-center gap-2 py-3">
                  <Receipt className="w-4 h-4" />
                  Cetak Struk Pembayaran
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}