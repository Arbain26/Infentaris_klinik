'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Transaksi, PengaturanKlinik, PaginationInfo } from '@/lib/types';
import { api } from '@/lib/api';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';
import { exportToPDF } from '@/lib/export-pdf';

interface TransaksiViewProps {
  pengaturan: PengaturanKlinik | null;
  categories: string[];
  onOpenAddModal: () => void;
  onOpenResetSaldo: () => void;
  onEditItem: (item: Transaksi) => void;
  refreshTrigger: number;
  onTriggerRefresh: () => void;
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  pengaturan,
  categories,
  onOpenAddModal,
  onOpenResetSaldo,
  onEditItem,
  refreshTrigger,
  onTriggerRefresh,
}) => {
  const currentYear = new Date().getFullYear().toString();

  // Filters
  const [tahun, setTahun] = useState<string>(currentYear);
  const [bulan, setBulan] = useState<string>('semua');
  const [dariTanggal, setDariTanggal] = useState<string>('');
  const [sampaiTanggal, setSampaiTanggal] = useState<string>('');
  const [jenis, setJenis] = useState<string>('semua');
  const [kategori, setKategori] = useState<string>('semua');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);

  // Data states
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Overall financial statistics (fetch all unpaginated for metrics)
  const [totalPemasukan, setTotalPemasukan] = useState<number>(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch filtered transactions with pagination for the table
      const res = await api.getTransaksi({
        tahun,
        bulan,
        dari_tanggal: dariTanggal || undefined,
        sampai_tanggal: sampaiTanggal || undefined,
        jenis: jenis !== 'semua' ? jenis : undefined,
        kategori: kategori !== 'semua' ? kategori : undefined,
        search: search.trim() || undefined,
        page,
        limit,
      });

      setTransaksiList(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }

      // 2. Fetch all transactions (unpaginated) for total saldo kas computation
      const allRes = await api.getTransaksi();
      let masuk = 0;
      let keluar = 0;
      (allRes.data || []).forEach((item) => {
        const nom = Number(item.nominal) || 0;
        if (item.jenis === 'Pemasukan') masuk += nom;
        else keluar += nom;
      });
      setTotalPemasukan(masuk);
      setTotalPengeluaran(keluar);
    } catch (err) {
      console.error('Error fetching transaksi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahun, bulan, dariTanggal, sampaiTanggal, jenis, kategori, search, page, limit, refreshTrigger]);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data transaksi ini?')) return;
    try {
      await api.deleteTransaksi(id);
      onTriggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi');
    }
  };

  const handleExportExcel = async () => {
    if (!pengaturan) return;
    // Export currently filtered list
    await exportToExcel(transaksiList, pengaturan, {
      tahun,
      bulan,
      dari_tanggal: dariTanggal,
      sampai_tanggal: sampaiTanggal,
    });
  };

  const handleExportPDF = () => {
    if (!pengaturan) return;
    exportToPDF(transaksiList, pengaturan, {
      tahun,
      bulan,
      dari_tanggal: dariTanggal,
      sampai_tanggal: sampaiTanggal,
    });
  };

  const resetAllFilters = () => {
    setTahun(currentYear);
    setBulan('semua');
    setDariTanggal('');
    setSampaiTanggal('');
    setJenis('semua');
    setKategori('semua');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo Kas */}
        <div className="p-5 bg-linear-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 tracking-wide uppercase">
              Saldo Kas Klinik
            </span>
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatRupiah(saldoKas)}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-100/80">Sisa saldo kas riil</span>
              <button
                onClick={onOpenResetSaldo}
                className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md transition-colors"
              >
                Sesuaikan
              </button>
            </div>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Pemasukan
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatRupiah(totalPemasukan)}
            </div>
            <span className="text-xs text-emerald-600 font-medium mt-1 block">
              Akumulasi dana masuk
            </span>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Pengeluaran
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatRupiah(totalPengeluaran)}
            </div>
            <span className="text-xs text-rose-600 font-medium mt-1 block">
              Akumulasi biaya &amp; inventaris
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {/* Tahun */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun</label>
            <select
              value={tahun}
              onChange={(e) => {
                setTahun(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="semua">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Bulan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan</label>
            <select
              value={bulan}
              onChange={(e) => {
                setBulan(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="semua">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          {/* Dari Tanggal */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dariTanggal}
              onChange={(e) => {
                setDariTanggal(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={sampaiTanggal}
              onChange={(e) => {
                setSampaiTanggal(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Jenis */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis</label>
            <select
              value={jenis}
              onChange={(e) => {
                setJenis(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="semua">Semua Jenis</option>
              <option value="Pengeluaran">Pengeluaran</option>
              <option value="Pemasukan">Pemasukan</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => {
                setKategori(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="semua">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari uraian transaksi / kategori..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {(dariTanggal || sampaiTanggal || bulan !== 'semua' || jenis !== 'semua' || kategori !== 'semua' || search) && (
              <button
                onClick={resetAllFilters}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Filter
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-28">Jenis</th>
                <th className="py-3 px-3 w-36">Kategori</th>
                <th className="py-3 px-4">Uraian / Keperluan</th>
                <th className="py-3 px-3 text-center w-24">Jumlah</th>
                <th className="py-3 px-3 text-right w-28">Harga Satuan</th>
                <th className="py-3 px-4 text-right w-36">Total (Rp)</th>
                <th className="py-3 px-3 text-center w-20">Metode</th>
                <th className="py-3 px-3 text-center w-16">Bukti</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Memuat data transaksi...</span>
                    </div>
                  </td>
                </tr>
              ) : transaksiList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                transaksiList.map((item, idx) => {
                  const itemIndex = pagination ? (pagination.page - 1) * pagination.limit + idx + 1 : idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {itemIndex}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {item.tanggal}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.jenis === 'Pemasukan'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.jenis}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 uppercase text-[11px]">
                        {item.kategori}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs break-words">
                        {item.uraian}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600">
                        {item.volume || 1} {item.satuan || 'Unit'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap text-slate-600 font-mono">
                        {item.harga_satuan ? formatRupiah(item.harga_satuan) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900 font-mono">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-600">{item.metode}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.foto_bukti ? (
                          <button
                            onClick={() => setPreviewPhoto(item.foto_bukti!)}
                            title="Lihat Bukti Foto Nota"
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditItem(item)}
                            title="Edit"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Menampilkan {transaksiList.length} dari total {pagination.total} transaksi (Halaman{' '}
              {pagination.page} dari {pagination.totalPages})
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[85vh] p-2 shadow-2xl"
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={previewPhoto}
                alt="Lampiran Bukti Nota"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

