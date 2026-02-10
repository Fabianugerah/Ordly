'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import {
  Receipt, Search, Eye, CreditCard, Banknote, Smartphone, RefreshCw,
  ChevronLeft, ChevronRight, MoreVertical, Printer, ExternalLink, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SingleDatePicker from '@/components/ui/SingleDatePicker';
import { PAYMENT_OPTIONS } from '@/constants/options';

interface TransactionPageProps {
  role: 'administrator' | 'kasir';
}

export default function TransactionPage({ role }: TransactionPageProps) {
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState<any[]>([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter State
  const [search, setSearch] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Semua');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Action Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => { 
    fetchTransaksi(); 
  }, []);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    filterTransaksi();
    setCurrentPage(1);
  }, [search, metodeBayar, selectedDate, transaksi]);

  // Close Action Menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null && !(event.target as Element).closest('.action-menu-trigger')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchTransaksi = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi')
        .select(`
          *,
          users:id_user (
            nama_user,
            username,
            level (
              nama_level
            )
          ),
          order:id_order (
            no_meja,
            tanggal,
            nama_pelanggan,
            status_order,
            detail_order (
              *,
              masakan (nama_masakan, kategori)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransaksi(data || []);
      setFilteredTransaksi(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      alert('Gagal memuat data transaksi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTransaksi = () => {
    let filtered = [...transaksi];
    if (search) {
      filtered = filtered.filter(t =>
        t.id_transaksi.toString().includes(search) ||
        t.order?.no_meja.toLowerCase().includes(search.toLowerCase()) ||
        t.order?.nama_pelanggan?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (metodeBayar !== 'Semua') {
      filtered = filtered.filter(t => t.metode_pembayaran === metodeBayar.toLowerCase());
    }

    // Logic Filter Date
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

  // --- LOGIC PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransaksi.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransaksi.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handlePrintReceipt = (transaksiId: number) => {
    window.open(`/guest/receipt?transaksi=${transaksiId}`, '_blank');
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

  const getRoleLabel = (user: any) => {
    if (!user) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
          Customer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 uppercase">
        {user.level?.nama_level || 'User'}
      </span>
    );
  };

  const stats = {
    total: transaksi.length,
    totalPendapatan: transaksi.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0),
    tunai: transaksi.filter(t => t.metode_pembayaran === 'tunai').length,
    debit: transaksi.filter(t => t.metode_pembayaran === 'debit').length,
    qris: transaksi.filter(t => t.metode_pembayaran === 'qris').length,
    hariIni: transaksi.filter(t => t.tanggal === new Date().toISOString().split('T')[0]).length,
  };

  const todayTotal = transaksi
    .filter((t) => t.tanggal === new Date().toISOString().split('T')[0])
    .reduce((sum, t) => sum + parseFloat(t.total_bayar), 0);

  if (loading) return (
    <DashboardLayout allowedRoles={[role]}>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-500 border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout allowedRoles={[role]}>
      <div className="space-y-6">

        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Riwayat Transaksi</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {role === 'administrator' ? 'Kelola dan monitor semua transaksi pembayaran' : 'Monitor semua transaksi pembayaran'}
            </p>
          </div>
          <Button onClick={fetchTransaksi} variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <RefreshCw className="w-5 h-5" /> {role === 'administrator' ? 'Refresh' : 'Refresh Data'}
          </Button>
        </div>

        {/* --- Stats Cards --- */}
        {role === 'administrator' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-neutral-800 dark:text-white' },
              { label: 'Revenue', value: `Rp ${(stats.totalPendapatan / 1000000).toFixed(1)}jt`, color: 'text-green-600' },
              { label: 'Hari Ini', value: stats.hariIni, color: 'text-blue-600' },
              { label: 'Tunai', value: stats.tunai, color: 'text-green-600' },
              { label: 'Debit', value: stats.debit, color: 'text-blue-600' },
              { label: 'QRIS', value: stats.qris, color: 'text-purple-600' }
            ].map((stat, i) => (
              <Card key={i} className="text-center p-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
              <p className="text-green-100 text-sm mb-1 font-medium">Pendapatan Hari Ini</p>
              <p className="text-3xl font-bold">Rp {(todayTotal / 1000).toFixed(0)}k</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 font-medium">Total Transaksi</p>
              <p className="text-3xl font-bold text-neutral-800 dark:text-white">{stats.total}</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 font-medium">Transaksi Hari Ini</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.hariIni}</p>
            </Card>
          </div>
        )}

        {/* --- Filters Section --- */}
        <div className={`flex flex-col lg:flex-row gap-4 ${role === 'administrator' ? 'pt-6' : ''}`}>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder={role === 'administrator' ? 'Cari ID Order atau Nomor Meja...' : 'Cari ID, Meja, atau Nama Pelanggan...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-500 transition-all placeholder:text-neutral-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">

            {/* SINGLE DATE PICKER COMPONENT */}
            <SingleDatePicker
              date={selectedDate}
              onChange={setSelectedDate}
            />

            {/* Status Dropdown */}
            <div className="w-full sm:w-48">
              <Select
                options={PAYMENT_OPTIONS}
                value={metodeBayar}
                onChange={(e) => setMetodeBayar(e.target.value)}
                className="!bg-neutral-50 dark:!bg-neutral-950 !py-2.5"
              />
            </div>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  {['ID', 'Tanggal', 'Pelanggan', 'Meja', 'Role', 'Metode', 'Total', 'Aksi'].map(h => (
                    <th key={h} className={`px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider ${h === 'Aksi' ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-2" />
                        <p>Tidak ada transaksi ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map(t => (
                    <tr key={t.id_transaksi} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                        #{t.id_transaksi}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                        {t.order?.nama_pelanggan || 'Customer'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-white">
                        {t.order?.no_meja || '-'}
                      </td>

                      {/* --- KOLOM ROLE --- */}
                      <td className="px-6 py-4 text-sm">
                        {getRoleLabel(t.users)}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentBadge(t.metode_pembayaran)}`}>
                          {getPaymentIcon(t.metode_pembayaran)}
                          <span className="uppercase tracking-wide">{t.metode_pembayaran}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-black dark:text-white tabular-nums">
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
                            className={`p-2 rounded-lg transition-colors ${openMenuId === t.id_transaksi
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintReceipt(t.id_transaksi);
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

          {/* --- FOOTER PAGINATION --- */}
          {filteredTransaksi.length > 0 && (
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Menampilkan <span className="font-medium text-neutral-900 dark:text-white">{indexOfFirstItem + 1}</span> sampai <span className="font-medium text-neutral-900 dark:text-white">{Math.min(indexOfLastItem, filteredTransaksi.length)}</span> dari <span className="font-medium text-neutral-900 dark:text-white">{filteredTransaksi.length}</span> data
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="!h-10 !w-10 !p-0 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(num => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1))
                    .map((number, index, array) => {
                      const showEllipsis = index > 0 && number > array[index - 1] + 1;
                      return (
                        <div key={number} className="flex items-center">
                          {showEllipsis && <span className="px-2 text-neutral-400">...</span>}
                          <button
                            onClick={() => paginate(number)}
                            className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === number
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                          >
                            {number}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="!h-10 !w-10 !p-0 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
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
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Pelanggan</p>
                  <p className="font-medium text-neutral-900 dark:text-white uppercase">
                    {selectedTransaksi.order?.nama_pelanggan || 'GUEST'}
                  </p>
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

                {/* --- Role Detail di Modal --- */}
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Role</p>
                  <div className="flex items-center">
                    {getRoleLabel(selectedTransaksi.users)}
                  </div>
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
                <Button
                  onClick={() => handlePrintReceipt(selectedTransaksi.id_transaksi)}
                  className="w-full flex items-center justify-center gap-2 py-3"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Struk & PDF
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}