// src/app/dashboard/kasir/transaksi/page.tsx (UPDATED)
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Receipt, Search, Eye, Banknote, CreditCard, QrCode, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function KasirTransaksiPage() {
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState<any[]>([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchTransaksi();
  }, []);

  useEffect(() => {
    filterTransaksi();
  }, [search, dateFilter, transaksi]);

  const fetchTransaksi = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi')
        .select(`
          *,
          users:id_user(nama_user),
          order:id_order(no_meja, detail_order(*, masakan(*)))
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransaksi(data);
      }
    } catch (error) {
      console.error('Error fetching transaksi:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransaksi = () => {
    let filtered = transaksi;

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.id_transaksi.toString().includes(search) ||
          t.order?.no_meja.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((t) => t.tanggal === dateFilter);
    }

    setFilteredTransaksi(filtered);
  };

  const getPaymentIcon = (metode: string) => {
    const metodeStr = metode.toLowerCase();
    if (metodeStr === 'tunai') return <Banknote className="w-4 h-4" />;
    if (metodeStr === 'qris') return <QrCode className="w-4 h-4" />;
    if (metodeStr === 'debit') return <CreditCard className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  const getPaymentBadge = (metode: string) => {
    const metodeStr = metode.toLowerCase();
    const styles = {
      tunai: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      debit: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      qris: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    };
    return styles[metodeStr as keyof typeof styles] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
  };

  const getPaymentLabel = (metode: string) => {
    const metodeStr = metode.toLowerCase();
    const labels = {
      tunai: 'Tunai',
      debit: 'Debit/Transfer',
      qris: 'QRIS/E-Wallet',
    };
    return labels[metodeStr as keyof typeof labels] || metode.toUpperCase();
  };

  const getPaymentDescription = (metode: string) => {
    const metodeStr = metode.toLowerCase();
    const descriptions = {
      tunai: 'Pembayaran cash',
      debit: 'Transfer bank atau kartu debit',
      qris: 'QRIS, GoPay, OVO, DANA, dll',
    };
    return descriptions[metodeStr as keyof typeof descriptions] || '';
  };

  const todayTotal = transaksi
    .filter((t) => t.tanggal === new Date().toISOString().split('T')[0])
    .reduce((sum, t) => sum + parseFloat(t.total_bayar), 0);

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['kasir']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['kasir']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Riwayat Transaksi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor semua transaksi pembayaran</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <p className="text-green-100 text-sm mb-1">Pendapatan Hari Ini</p>
            <p className="text-3xl font-bold">Rp {(todayTotal / 1000).toFixed(0)}k</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Transaksi</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{transaksi.length}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaksi Hari Ini</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {transaksi.filter((t) => t.tanggal === new Date().toISOString().split('T')[0]).length}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari ID transaksi atau meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </Card>

        {/* Transactions Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Meja</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Metode</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransaksi.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredTransaksi.map((t) => (
                    <tr key={t.id_transaksi} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">#{t.id_transaksi}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(t.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Meja {t.order?.no_meja || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getPaymentBadge(
                            t.metode_pembayaran
                          )}`}
                        >
                          {getPaymentIcon(t.metode_pembayaran)}
                          {getPaymentLabel(t.metode_pembayaran)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
                        Rp {parseFloat(t.total_bayar).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedTransaksi(t);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
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
        >
          {selectedTransaksi && (
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    Rp {parseFloat(selectedTransaksi.total_bayar).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Uang Diterima</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Rp{' '}
                      {selectedTransaksi.uang_diterima
                        ? parseFloat(selectedTransaksi.uang_diterima).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Kembalian</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Rp{' '}
                      {selectedTransaksi.kembalian
                        ? parseFloat(selectedTransaksi.kembalian).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Metode</p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getPaymentBadge(
                        selectedTransaksi.metode_pembayaran
                      )}`}
                    >
                      {getPaymentIcon(selectedTransaksi.metode_pembayaran)}
                      {getPaymentLabel(selectedTransaksi.metode_pembayaran)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Description */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    {getPaymentDescription(selectedTransaksi.metode_pembayaran)}
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Meja</p>
                  <p className="font-semibold text-gray-900 dark:text-white">Meja {selectedTransaksi.order?.no_meja || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tanggal</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedTransaksi.tanggal).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kasir</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedTransaksi.users?.nama_user || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">#{selectedTransaksi.id_order}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedTransaksi.order?.detail_order?.map((detail: any) => (
                    <div
                      key={detail.id_detail_order}
                      className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{detail.masakan?.nama_masakan}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {detail.jumlah} x Rp{' '}
                          {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Button */}
              <Button className="w-full">
                <Receipt className="w-4 h-4 mr-2" />
                Cetak Struk
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}