'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Receipt, Search, Eye, Banknote, CreditCard, Smartphone } from 'lucide-react';
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
      tunai: 'bg-green-100 text-green-800',
      debit: 'bg-blue-100 text-blue-800',
      qris: 'bg-purple-100 text-purple-800',
    };
    return styles[metode.toLowerCase() as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-800">Riwayat Transaksi</h1>
          <p className="text-gray-600 mt-1">Monitor semua transaksi pembayaran</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm mb-1">Pendapatan Hari Ini</p>
            <p className="text-3xl font-bold">Rp {(todayTotal / 1000).toFixed(0)}k</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
            <p className="text-3xl font-bold text-gray-800">{transaksi.length}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-600 mb-1">Transaksi Hari Ini</p>
            <p className="text-3xl font-bold text-blue-600">
              {transaksi.filter((t) => t.tanggal === new Date().toISOString().split('T')[0]).length}
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4">
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
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Meja</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Metode</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransaksi.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredTransaksi.map((t) => (
                    <tr key={t.id_transaksi} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">#{t.id_transaksi}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(t.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-sm">Meja {t.order?.no_meja || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(
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
        </Card>

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
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-green-600">
                    Rp {parseFloat(selectedTransaksi.total_bayar).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-gray-600">Uang Diterima</p>
                    <p className="font-semibold">
                      Rp{' '}
                      {selectedTransaksi.uang_diterima
                        ? parseFloat(selectedTransaksi.uang_diterima).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Kembalian</p>
                    <p className="font-semibold">
                      Rp{' '}
                      {selectedTransaksi.kembalian
                        ? parseFloat(selectedTransaksi.kembalian).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Metode</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(
                        selectedTransaksi.metode_pembayaran
                      )}`}
                    >
                      {getPaymentIcon(selectedTransaksi.metode_pembayaran)}
                      {selectedTransaksi.metode_pembayaran.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Meja</p>
                  <p className="font-semibold">Meja {selectedTransaksi.order?.no_meja || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-semibold">
                    {new Date(selectedTransaksi.tanggal).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kasir</p>
                  <p className="font-semibold">{selectedTransaksi.users?.nama_user || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold">#{selectedTransaksi.id_order}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedTransaksi.order?.detail_order?.map((detail: any) => (
                    <div
                      key={detail.id_detail_order}
                      className="flex justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{detail.masakan?.nama_masakan}</p>
                        <p className="text-sm text-gray-600">
                          {detail.jumlah} x Rp{' '}
                          {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

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