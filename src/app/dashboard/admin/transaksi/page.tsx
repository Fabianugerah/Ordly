'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Receipt, Search, Eye, CreditCard, Banknote, Smartphone, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminTransaksiPage() {
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState<any[]>([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchTransaksi();
  }, []);

  useEffect(() => {
    filterTransaksi();
  }, [search, metodeBayar, dateFilter, transaksi]);

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
      console.error('Error fetching transaksi:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTransaksi = () => {
    let filtered = [...transaksi];

    // Filter by search (transaction ID or table)
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.id_transaksi.toString().includes(search) ||
          t.order?.no_meja.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by payment method
    if (metodeBayar !== 'Semua') {
      filtered = filtered.filter(
        (t) => t.metode_pembayaran === metodeBayar.toLowerCase()
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter((t) => t.tanggal === dateFilter);
    }

    setFilteredTransaksi(filtered);
  };

  const handleViewDetail = (transaksi: any) => {
    setSelectedTransaksi(transaksi);
    setShowDetailModal(true);
  };

  const getPaymentIcon = (metode: string) => {
    switch (metode.toLowerCase()) {
      case 'tunai':
        return <Banknote className="w-4 h-4" />;
      case 'debit':
        return <CreditCard className="w-4 h-4" />;
      case 'qris':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getPaymentBadge = (metode: string) => {
    const styles = {
      tunai: 'bg-green-100 text-green-800 border-green-200',
      debit: 'bg-blue-100 text-blue-800 border-blue-200',
      qris: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return styles[metode.toLowerCase() as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const metodeOptions = ['Semua', 'Tunai', 'Debit', 'QRIS'];

  // Statistics
  const stats = {
    total: transaksi.length,
    totalPendapatan: transaksi.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0),
    tunai: transaksi.filter((t) => t.metode_pembayaran === 'tunai').length,
    debit: transaksi.filter((t) => t.metode_pembayaran === 'debit').length,
    qris: transaksi.filter((t) => t.metode_pembayaran === 'qris').length,
    hariIni: transaksi.filter(
      (t) => t.tanggal === new Date().toISOString().split('T')[0]
    ).length,
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['administrator']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Riwayat Transaksi</h1>
            <p className="text-gray-600 mt-1">Kelola dan monitor semua transaksi pembayaran</p>
          </div>
          <Button
            onClick={fetchTransaksi}
            className="flex items-center gap-2"
            variant="outline"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-green-600 mb-1">Total Pendapatan</p>
            <p className="text-lg font-bold text-green-600">
              Rp {(stats.totalPendapatan / 1000000).toFixed(1)}jt
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-blue-600 mb-1">Hari Ini</p>
            <p className="text-2xl font-bold text-blue-600">{stats.hariIni}</p>
          </Card>
          <Card className="text-center">
            <Banknote className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600 mb-1">Tunai</p>
            <p className="text-xl font-bold text-gray-800">{stats.tunai}</p>
          </Card>
          <Card className="text-center">
            <CreditCard className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600 mb-1">Debit</p>
            <p className="text-xl font-bold text-gray-800">{stats.debit}</p>
          </Card>
          <Card className="text-center">
            <Smartphone className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600 mb-1">QRIS</p>
            <p className="text-xl font-bold text-gray-800">{stats.qris}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari ID transaksi atau meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Payment Method Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {metodeOptions.map((metode) => (
                <button
                  key={metode}
                  onClick={() => setMetodeBayar(metode)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    metodeBayar === metode
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {metode}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Meja
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Kasir
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Metode
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransaksi.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>Tidak ada transaksi ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransaksi.map((t) => (
                    <tr key={t.id_transaksi} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        #{t.id_transaksi}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(t.tanggal).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        #{t.id_order}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                        Meja {t.order?.no_meja || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t.users?.nama_user || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getPaymentBadge(
                            t.metode_pembayaran
                          )}`}
                        >
                          {getPaymentIcon(t.metode_pembayaran)}
                          {t.metode_pembayaran.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        Rp {parseFloat(t.total_bayar).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewDetail(t)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Detail"
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
        </Card>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaksi(null);
          }}
          title={`Detail Transaksi #${selectedTransaksi?.id_transaksi}`}
          size="lg"
        >
          {selectedTransaksi && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-gray-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-green-600">
                    Rp {parseFloat(selectedTransaksi.total_bayar).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Uang Diterima</p>
                    <p className="font-semibold text-gray-800">
                      Rp{' '}
                      {selectedTransaksi.uang_diterima
                        ? parseFloat(selectedTransaksi.uang_diterima).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Kembalian</p>
                    <p className="font-semibold text-gray-800">
                      Rp{' '}
                      {selectedTransaksi.kembalian
                        ? parseFloat(selectedTransaksi.kembalian).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Metode</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPaymentBadge(
                        selectedTransaksi.metode_pembayaran
                      )}`}
                    >
                      {getPaymentIcon(selectedTransaksi.metode_pembayaran)}
                      {selectedTransaksi.metode_pembayaran.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">ID Transaksi</p>
                  <p className="font-semibold">#{selectedTransaksi.id_transaksi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID Order</p>
                  <p className="font-semibold">#{selectedTransaksi.id_order}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-semibold">
                    {new Date(selectedTransaksi.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nomor Meja</p>
                  <p className="font-semibold">
                    Meja {selectedTransaksi.order?.no_meja || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kasir</p>
                  <p className="font-semibold">
                    {selectedTransaksi.users?.nama_user || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold capitalize">
                    {selectedTransaksi.users?.level?.nama_level || '-'}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedTransaksi.order?.detail_order?.map((detail: any) => (
                    <div
                      key={detail.id_detail_order}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {detail.masakan?.nama_masakan}
                        </p>
                        <p className="text-sm text-gray-600">
                          {detail.jumlah} x Rp{' '}
                          {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                        </p>
                        {detail.masakan?.kategori && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {detail.masakan.kategori}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-800">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Receipt Button */}
              <div className="pt-4 border-t">
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