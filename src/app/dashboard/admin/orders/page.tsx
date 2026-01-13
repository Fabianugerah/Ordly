'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  ShoppingCart, Search, Eye, Edit, Clock, CheckCircle, XCircle, RefreshCw,
  Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const statusOptions = ['Semua', 'Pending', 'Proses', 'Selesai', 'Dibatalkan'];

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { filterOrders(); }, [search, statusFilter, selectedDate, orders]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

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
      // Mengambil tahun, bulan, dan tanggal secara lokal
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(selectedDate); // Outputnya otomatis YYYY-MM-DD

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
    const styles = { pending: 'bg-amber-100 text-amber-800', proses: 'bg-blue-100 text-blue-800', selesai: 'bg-green-100 text-green-800', dibatalkan: 'bg-red-100 text-red-800' };
    return styles[status as keyof typeof styles] || 'bg-neutral-100 text-neutral-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = { pending: Clock, proses: RefreshCw, selesai: CheckCircle, dibatalkan: XCircle };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="w-4 h-4" />;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Manajemen Pesanan</h1>
            <p className="text-neutral-600 mt-1">Kelola semua pesanan restoran</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-neutral-800 dark:text-white' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Proses', value: stats.proses, color: 'text-blue-600' },
            { label: 'Selesai', value: stats.selesai, color: 'text-green-600' },
            { label: 'Dibatalkan', value: stats.dibatalkan, color: 'text-red-600' },
            { label: 'Revenue', value: `Rp ${(stats.totalRevenue / 1000).toFixed(0)}k`, color: 'text-green-600' }
          ].map((stat, i) => (
            <Card key={i} className="text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input type="text" placeholder="Cari order ID atau meja..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
            </div>

            <div className="relative" ref={datePickerRef}>
              <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-800 min-w-[200px]">
                <Calendar className="w-5 h-5 text-neutral-400" />
                <span className="flex-1 text-left text-neutral-900 dark:text-white">
                  {selectedDate ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal'}
                </span>
                {selectedDate && (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }} className="text-neutral-400 hover:text-neutral-600">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </button>

              {showDatePicker && (
                <div className="absolute top-full mt-4 left-0 z-50 bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 min-w-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="font-bold text-neutral-900 dark:text-white">{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                      <ChevronRight className="w-5 h-5 text-white" />
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

            <div className="flex gap-2 overflow-x-auto">
              {statusOptions.map(status => (
                <button key={status}
                  onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors 
                ${statusFilter === status
                      ? 'bg-neutral-800 text-white shadow-md'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-800'
                    }`}>
                  {status}
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
                  {['Order ID', 'Tanggal', 'Meja', 'Waiter', 'Items', 'Total', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    <ShoppingCart className="w-12 h-12 text-neutral-300 mx-auto mb-2" /><p>Tidak ada pesanan</p>
                  </td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id_order} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <td className="px-4 py-6 text-sm font-medium text-neutral-800 dark:text-white">#{order.id_order}</td>
                      <td className="px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">{new Date(order.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-6 text-sm font-semibold text-neutral-800 dark:text-white">Meja {order.no_meja}</td>
                      <td className="px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">{order.users?.nama_user || '-'}</td>
                      <td className="px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">{order.detail_order?.length || 0} item</td>
                      <td className="px-4 py-6 text-sm font-bold text-neutral-800 dark:text-white">Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status_order)}`}>
                          {getStatusIcon(order.status_order)}{order.status_order.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedOrder(order); setShowStatusModal(true); }} className="text-green-600 hover:text-green-800"><Edit className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedOrder(null); }} title={`Detail Order #${selectedOrder?.id_order}`}>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b dark:border-neutral-700">
                <div><p className="text-sm text-neutral-600 dark:text-neutral-400">Meja</p><p className="font-semibold text-lg text-neutral-900 dark:text-white">Meja {selectedOrder.no_meja}</p></div>
                <div><p className="text-sm text-neutral-600 dark:text-neutral-400">Status</p><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status_order)}`}>{getStatusIcon(selectedOrder.status_order)}{selectedOrder.status_order.toUpperCase()}</span></div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-neutral-900 dark:text-white">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.detail_order?.map((d: any) => (
                    <div key={d.id_detail_order} className="flex justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div><p className="font-medium text-neutral-800 dark:text-white">{d.masakan?.nama_masakan}</p><p className="text-sm text-neutral-600 dark:text-neutral-400">{d.jumlah} x Rp {parseFloat(d.harga_satuan).toLocaleString('id-ID')}</p></div>
                      <p className="font-bold text-neutral-800 dark:text-white">Rp {parseFloat(d.subtotal).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t dark:border-neutral-700 flex justify-between">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-primary">Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={showStatusModal} onClose={() => { setShowStatusModal(false); setSelectedOrder(null); }} title={`Update Status #${selectedOrder?.id_order}`}>
          {selectedOrder && (
            <div className="space-y-4">
              <div><p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Status Saat Ini:</p><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status_order)}`}>{getStatusIcon(selectedOrder.status_order)}{selectedOrder.status_order.toUpperCase()}</span></div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { status: 'pending', label: 'Pending', icon: Clock, color: 'bg-amber-600 hover:bg-amber-700' },
                  { status: 'proses', label: 'Proses', icon: RefreshCw, color: 'bg-blue-600 hover:bg-blue-700' },
                  { status: 'selesai', label: 'Selesai', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
                  { status: 'dibatalkan', label: 'Batalkan', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' }
                ].map(({ status, label, icon: Icon, color }) => (
                  <button key={status} onClick={() => handleUpdateStatus(selectedOrder.id_order, status)} disabled={selectedOrder.status_order === status} className={`flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${color}`}>
                    <Icon className="w-4 h-4" />{label}
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