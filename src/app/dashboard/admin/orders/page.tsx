'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import {
  ShoppingCart, Search, Eye, Edit, Clock, CheckCircle, XCircle, RefreshCw,
  Calendar, ChevronLeft, ChevronRight, MoreVertical, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Opsi Filter Status untuk Dropdown
const STATUS_OPTIONS = [
  { value: 'Semua', label: 'Semua Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Dibatalkan', label: 'Dibatalkan' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Filter State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Date Picker State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Action Menu State (Kebab Menu)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { filterOrders(); }, [search, statusFilter, selectedDate, orders]);
  
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('order').select(`*, users:id_user(nama_user, username), detail_order(*, masakan(nama_masakan, harga, kategori))`).order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    if (search) filtered = filtered.filter(o => o.id_order.toString().includes(search) || o.no_meja.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'Semua') filtered = filtered.filter(o => o.status_order === statusFilter.toLowerCase());
    if (selectedDate) {
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(selectedDate);
      filtered = filtered.filter(o => o.tanggal === dateStr);
    }
    setFilteredOrders(filtered);
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

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const { error } = await supabase.from('order').update({ status_order: newStatus }).eq('id_order', orderId);
      if (error) throw error;
      await supabase.from('detail_order').update({ status_detail_order: newStatus }).eq('id_order', orderId);
      alert('Status berhasil diupdate!');
      setShowStatusModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = { 
        pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', 
        proses: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', 
        selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', 
        dibatalkan: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
    };
    return styles[status as keyof typeof styles] || 'bg-neutral-100 text-neutral-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = { pending: Clock, proses: RefreshCw, selesai: CheckCircle, dibatalkan: XCircle };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="w-3.5 h-3.5" />;
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status_order === 'pending').length,
    proses: orders.filter(o => o.status_order === 'proses').length,
    selesai: orders.filter(o => o.status_order === 'selesai').length,
    dibatalkan: orders.filter(o => o.status_order === 'dibatalkan').length,
    totalRevenue: orders.filter(o => o.status_order === 'selesai').reduce((sum, o) => sum + parseFloat(o.total_harga), 0),
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
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Manajemen Pesanan</h1>
            <p className="text-neutral-600 mt-1">Kelola dan pantau pesanan masuk</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <RefreshCw className="w-5 h-5" /> Refresh
          </Button>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-neutral-800 dark:text-white' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Proses', value: stats.proses, color: 'text-blue-600' },
            { label: 'Selesai', value: stats.selesai, color: 'text-emerald-600' },
            { label: 'Dibatalkan', value: stats.dibatalkan, color: 'text-red-600' },
            { label: 'Revenue', value: `Rp ${(stats.totalRevenue / 1000).toFixed(0)}k`, color: 'text-emerald-600' }
          ].map((stat, i) => (
            <Card key={i} className="text-center p-4">
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
                placeholder="Cari ID Order atau Nomor Meja..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" 
            />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Date Picker (STYLE ASLI DIPERTAHANKAN) */}
                <div className="relative w-full sm:w-auto" ref={datePickerRef}>
                  <button 
                    onClick={() => setShowDatePicker(!showDatePicker)} 
                    className="w-full sm:w-64 flex items-center justify-between gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[200px]"
                  >
                    <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
                        <Calendar className="w-5 h-5 text-neutral-400" />
                        <span className="flex-1 text-left">
                          {selectedDate ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal'}
                        </span>
                    </div>
                    {selectedDate && (
                      <div onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                          <XCircle className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  {showDatePicker && (
                    /* PERUBAHAN POSISI: `left-0` agar kalender rata kiri dengan tombol dan memanjang ke kanan. 
                       STYLE VISUAL: Tetap menggunakan `bg-neutral-900/60 backdrop-blur-md` sesuai permintaan.
                    */
                    <div className="absolute top-full mt-4 left-0 z-50 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 min-w-[320px] animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                          <ChevronLeft className="w-5 h-5 text-neutral-900 dark:text-white" />
                        </button>
                        <span className="font-bold text-neutral-900 dark:text-white">{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                          <ChevronRight className="w-5 h-5 text-neutral-900 dark:text-white" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map(day => <div key={day} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-2">{day}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentMonth).map((date, i) => {
                          if (!date) return <div key={`e-${i}`} className="aspect-square" />;
                          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                          const isToday = date.toDateString() === new Date().toDateString();
                          return (
                            <button key={i} onClick={() => handleDateClick(date)} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-orange-500 text-white shadow-md' : isToday ? 'bg-blue-50 dark:bg-orange-900/20 text-orange-500 border border-orange-500' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}>
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Dropdown (Replacing Buttons) */}
                <div className="w-full sm:w-48">
                    <Select
                        options={STATUS_OPTIONS}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="!bg-neutral-50 dark:!bg-neutral-800 !py-2.5"
                    />
                </div>
            </div>

          </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  {['Order ID', 'Tanggal', 'Meja', 'Waiter', 'Items', 'Total', 'Status', 'Aksi'].map(h => (
                    <th key={h} className={`px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider ${h === 'Aksi' ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <div className="flex flex-col items-center gap-2">
                        <ShoppingCart className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-2" />
                        <p>Tidak ada pesanan ditemukan</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id_order} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">#{order.id_order}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{new Date(order.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-white">Meja {order.no_meja}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{order.users?.nama_user || '-'}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{order.detail_order?.length || 0} item</td>
                      <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white tabular-nums">Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status_order)}`}>
                          {getStatusIcon(order.status_order)}
                          <span className="uppercase tracking-wide">{order.status_order}</span>
                        </span>
                      </td>
                      
                      {/* --- Action Menu (Kebab) --- */}
                      <td className="px-6 py-4 text-center relative">
                        <div className="relative inline-block action-menu-trigger">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === order.id_order ? null : order.id_order);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                    openMenuId === order.id_order 
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' 
                                    : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {openMenuId === order.id_order && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOrder(order);
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
                                            setSelectedOrder(order);
                                            setShowStatusModal(true);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                                    >
                                        <Edit className="w-4 h-4 text-green-500" /> 
                                        Update Status
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
        <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedOrder(null); }} title={`Detail Order #${selectedOrder?.id_order}`}>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Lokasi</p>
                    <p className="font-semibold text-lg text-neutral-900 dark:text-white">Meja {selectedOrder.no_meja}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedOrder.status_order)}`}>
                        {getStatusIcon(selectedOrder.status_order)}
                        <span className="uppercase">{selectedOrder.status_order}</span>
                    </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-neutral-900 dark:text-white">Daftar Item</h4>
                <div className="space-y-3">
                  {selectedOrder.detail_order?.map((d: any) => (
                    <div key={d.id_detail_order} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-700">
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-white">{d.masakan?.nama_masakan}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{d.jumlah} x Rp {parseFloat(d.harga_satuan).toLocaleString('id-ID')}</p>
                      </div>
                      <p className="font-bold text-neutral-800 dark:text-white">Rp {parseFloat(d.subtotal).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">Total Tagihan</span>
                  <span className="text-2xl font-bold text-orange-600">Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>Tutup</Button>
                <Button onClick={() => { setShowDetailModal(false); setShowStatusModal(true); }}>Update Status</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* --- Update Status Modal --- */}
        <Modal isOpen={showStatusModal} onClose={() => { setShowStatusModal(false); setSelectedOrder(null); }} title={`Update Status #${selectedOrder?.id_order}`}>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Status Saat Ini:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedOrder.status_order)}`}>
                    {getStatusIcon(selectedOrder.status_order)}
                    <span className="uppercase">{selectedOrder.status_order}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { status: 'pending', label: 'Pending', icon: Clock, color: 'hover:bg-amber-600 hover:border-amber-600 hover:text-white border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
                  { status: 'proses', label: 'Proses', icon: RefreshCw, color: 'hover:bg-blue-600 hover:border-blue-600 hover:text-white border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
                  { status: 'selesai', label: 'Selesai', icon: CheckCircle, color: 'hover:bg-emerald-600 hover:border-emerald-600 hover:text-white border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' },
                  { status: 'dibatalkan', label: 'Batalkan', icon: XCircle, color: 'hover:bg-red-600 hover:border-red-600 hover:text-white border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' }
                ].map(({ status, label, icon: Icon, color }) => (
                  <button 
                    key={status} 
                    onClick={() => handleUpdateStatus(selectedOrder.id_order, status)} 
                    disabled={selectedOrder.status_order === status} 
                    className={`flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${color}`}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}