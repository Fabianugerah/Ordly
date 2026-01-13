'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  Receipt, Search, Eye, CreditCard, Banknote, Smartphone, RefreshCw,
  Calendar, ChevronLeft, ChevronRight, XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminTransaksiPage() {
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState<any[]>([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Semua');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const metodeOptions = ['Semua', 'Tunai', 'Debit', 'QRIS'];

  useEffect(() => { fetchTransaksi(); }, []);
  useEffect(() => { filterTransaksi(); }, [search, metodeBayar, selectedDate, transaksi]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

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
    return <Icon className="w-4 h-4" />;
  };

  const getPaymentBadge = (metode: string) => {
    const styles = {
      tunai: 'bg-green-100 text-green-800',
      debit: 'bg-blue-100 text-blue-800',
      qris: 'bg-purple-100 text-purple-800',
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Riwayat Transaksi</h1>
            <p className="text-neutral-600 mt-1">Kelola dan monitor semua transaksi pembayaran</p>
          </div>
          <Button onClick={fetchTransaksi} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-neutral-800 dark:text-white' },
            { label: 'Revenue', value: `Rp ${(stats.totalPendapatan / 1000000).toFixed(1)}jt`, color: 'text-green-600' },
            { label: 'Hari Ini', value: stats.hariIni, color: 'text-blue-600' },
            { label: 'Tunai', value: stats.tunai, color: 'text-green-600', icon: Banknote },
            { label: 'Debit', value: stats.debit, color: 'text-blue-600', icon: CreditCard },
            { label: 'QRIS', value: stats.qris, color: 'text-purple-600', icon: Smartphone }
          ].map((stat, i) => (
            <Card key={i} className="text-center">
              {stat.icon && <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-1`} />}
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari ID transaksi atau meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[200px]"
              >
                <Calendar className="w-5 h-5 text-neutral-400" />
                <span className="flex-1 text-left text-neutral-900 dark:text-white">
                  {selectedDate ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal'}
                </span>
                {selectedDate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </button>

              {showDatePicker && (
                <div className="absolute top-full mt-4 left-0 z-50 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 min-w-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
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

            <div className="flex gap-2 overflow-x-auto">
              {metodeOptions.map(metode => (
                <button
                  key={metode}
                  onClick={() => setMetodeBayar(metode)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    metodeBayar === metode
                      ? 'bg-neutral-800 text-white shadow-md'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  {metode}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  {['ID', 'Tanggal', 'Order ID', 'Meja', 'Kasir', 'Metode', 'Total', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredTransaksi.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      <Receipt className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                      <p>Tidak ada transaksi ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransaksi.map(t => (
                    <tr key={t.id_transaksi} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <td className="px-4 py-6 text-sm font-medium text-neutral-800 dark:text-white">
                        #{t.id_transaksi}
                      </td>
                      <td className="px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">
                        #{t.id_order}
                      </td>
                      <td className="px-4 py-6 text-sm font-semibold text-neutral-800 dark:text-white">
                        Meja {t.order?.no_meja || '-'}
                      </td>
                      <td className="px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">
                        {t.users?.nama_user || '-'}
                      </td>
                      <td className="px-4 py-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadge(t.metode_pembayaran)}`}>
                          {getPaymentIcon(t.metode_pembayaran)}
                          {t.metode_pembayaran.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-6 text-sm font-bold text-green-600">
                        Rp {parseFloat(t.total_bayar).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-6">
                        <button
                          onClick={() => {
                            setSelectedTransaksi(t);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaksi(null);
          }}
          title={`Detail Transaksi #${selectedTransaksi?.id_transaksi}`}
        >
          {selectedTransaksi && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="text-center mb-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-green-600">
                    Rp {parseFloat(selectedTransaksi.total_bayar).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Uang Diterima</p>
                    <p className="font-semibold text-neutral-800 dark:text-white">
                      Rp {selectedTransaksi.uang_diterima ? parseFloat(selectedTransaksi.uang_diterima).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Kembalian</p>
                    <p className="font-semibold text-neutral-800 dark:text-white">
                      Rp {selectedTransaksi.kembalian ? parseFloat(selectedTransaksi.kembalian).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Metode</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(selectedTransaksi.metode_pembayaran)}`}>
                      {getPaymentIcon(selectedTransaksi.metode_pembayaran)}
                      {selectedTransaksi.metode_pembayaran.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b dark:border-neutral-700">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">ID Transaksi</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">#{selectedTransaksi.id_transaksi}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">ID Order</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">#{selectedTransaksi.id_order}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Tanggal</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {new Date(selectedTransaksi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Nomor Meja</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    Meja {selectedTransaksi.order?.no_meja || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Kasir</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {selectedTransaksi.users?.nama_user || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Role</p>
                  <p className="font-semibold capitalize text-neutral-900 dark:text-white">
                    {selectedTransaksi.users?.level?.nama_level || '-'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-neutral-900 dark:text-white">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedTransaksi.order?.detail_order?.map((detail: any) => (
                    <div key={detail.id_detail_order} className="flex justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-white">{detail.masakan?.nama_masakan}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {detail.jumlah} x Rp {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                        </p>
                        {detail.masakan?.kategori && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {detail.masakan.kategori}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-neutral-800 dark:text-white">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t dark:border-neutral-700 flex justify-between">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    Rp {parseFloat(selectedTransaksi.total_bayar).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t dark:border-neutral-700">
                <Button className="w-full flex items-center justify-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Cetak Struk
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}