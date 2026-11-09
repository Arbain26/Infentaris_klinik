'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  MapPin,
  Calendar,
} from 'lucide-react';
import { StokBarang, PaginationInfo, PengaturanKlinik } from '@/lib/types';
import { api } from '@/lib/api';
import { exportStokToExcel } from '@/lib/export-excel';
import { exportStokToPDF } from '@/lib/export-pdf';

interface StokViewProps {
  pengaturan: PengaturanKlinik | null;
  onOpenAddModal: () => void;
  onEditItem: (item: StokBarang) => void;
  refreshTrigger: number;
  onTriggerRefresh: () => void;
}

export const StokView: React.FC<StokViewProps> = ({
  pengaturan,
  onOpenAddModal,
  onEditItem,
  refreshTrigger,
  onTriggerRefresh,
}) => {
  const [kategori, setKategori] = useState<string>('semua');
  const [kondisi, setKondisi] = useState<string>('semua');
  const [ruangan, setRuangan] = useState<string>('semua');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);

  const [stokList, setStokList] = useState<StokBarang[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // Overall metric counts
  const [totalUnit, setTotalUnit] = useState<number>(0);
  const [totalBaik, setTotalBaik] = useState<number>(0);
  const [totalRusak, setTotalRusak] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getStokBarang({
        kategori: kategori !== 'semua' ? kategori : undefined,
        kondisi: kondisi !== 'semua' ? kondisi : undefined,
        ruangan: ruangan !== 'semua' ? ruangan : undefined,
        search: search.trim() || undefined,
        page,
        limit,
      });

      setStokList(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }

      // Compute statistics from unpaginated fetch
      const allRes = await api.getStokBarang();
      let total = 0;
      let baik = 0;
      let rusak = 0;
      (allRes.data || []).forEach((item) => {
        const jml = Number(item.jumlah) || 0;
        total += jml;
        if (item.kondisi === 'Baik') baik += jml;
        else rusak += jml;
      });
      setTotalUnit(total);
      setTotalBaik(baik);
      setTotalRusak(rusak);
    } catch (err) {
      console.error('Error fetching stok:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kategori, kondisi, ruangan, search, page, limit, refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data inventaris barang ini?')) return;
    try {
      await api.deleteStokBarang(id);
      onTriggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus stok');
    }
  };

  const handleExportExcel = async () => {
    if (!pengaturan) return;
    setExporting(true);
    try {
      const res = await api.getStokBarang({
        kategori: kategori !== 'semua' ? kategori : undefined,
        kondisi: kondisi !== 'semua' ? kondisi : undefined,
        ruangan: ruangan !== 'semua' ? ruangan : undefined,
        search: search.trim() || undefined,
      });
      await exportStokToExcel(res.data, pengaturan, {
        kategori: kategori !== 'semua' ? kategori : undefined,
        kondisi: kondisi !== 'semua' ? kondisi : undefined,
        ruangan: ruangan !== 'semua' ? ruangan : undefined,
      });
    } catch (err) {
      console.error('Export Excel failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!pengaturan) return;
    setExporting(true);
    try {
      const res = await api.getStokBarang({
        kategori: kategori !== 'semua' ? kategori : undefined,
        kondisi: kondisi !== 'semua' ? kondisi : undefined,
        ruangan: ruangan !== 'semua' ? ruangan : undefined,
        search: search.trim() || undefined,
      });
      exportStokToPDF(res.data, pengaturan, {
        kategori: kategori !== 'semua' ? kategori : undefined,
        kondisi: kondisi !== 'semua' ? kondisi : undefined,
        ruangan: ruangan !== 'semua' ? ruangan : undefined,
      });
    } catch (err) {
      console.error('Export PDF failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const resetAllFilters = () => {
    setKategori('semua');
    setKondisi('semua');
    setRuangan('semua');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Seluruh Aset / Barang
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {totalUnit.toLocaleString('id-ID')}
            </div>
            <span className="text-xs text-blue-600 font-medium mt-1 block">Unit fisik tercatat</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Kondisi Prima / Baik
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {totalBaik.toLocaleString('id-ID')}
            </div>
            <span className="text-xs text-emerald-600 font-medium mt-1 block">
              Siap pakai &amp; operasional
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Rusak Ringan &amp; Berat
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {totalRusak.toLocaleString('id-ID')}
            </div>
            <span className="text-xs text-amber-600 font-medium mt-1 block">
              Perlu perbaikan / penggantian
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => {
                setKategori(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="semua">Semua Kategori</option>
              <option value="ALAT MEDIS">ALAT MEDIS</option>
              <option value="ALAT KANTOR">ALAT KANTOR</option>
              <option value="ALAT LISTRIK">ALAT LISTRIK</option>
              <option value="ALAT KEBERSIHAN">ALAT KEBERSIHAN</option>
              <option value="MEUBEL & ASET">MEUBEL &amp; ASET</option>
              <option value="OBAT & BHP">OBAT &amp; BHP</option>
              <option value="LAINNYA">LAINNYA</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kondisi</label>
            <select
              value={kondisi}
              onChange={(e) => {
                setKondisi(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="semua">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ruangan</label>
            <select
              value={ruangan}
              onChange={(e) => {
                setRuangan(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="semua">Semua Ruangan</option>
              <option value="Poli Umum">Poli Umum</option>
              <option value="Ruang Farmasi">Ruang Farmasi</option>
              <option value="Ruang Tunggu">Ruang Tunggu</option>
              <option value="Kasir & Pendaftaran">Kasir &amp; Pendaftaran</option>
              <option value="Laboratorium">Laboratorium</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pencarian</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nama / kode barang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons for Export */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Total <span className="font-semibold text-slate-800">{stokList.length}</span> barang ditampilkan di tabel
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto justify-end">
            {(kategori !== 'semua' || kondisi !== 'semua' || ruangan !== 'semua' || search) && (
              <button
                onClick={resetAllFilters}
                className="col-span-2 sm:col-span-1 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
              >
                Reset Filter
              </button>
            )}

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{exporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>{exporting ? 'Mengekspor...' : 'Ekspor PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memuat data inventaris...</span>
            </div>
          </div>
        ) : stokList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
            Tidak ada barang yang cocok dengan filter.
          </div>
        ) : (
          stokList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3"
            >
              {/* Header: Code & Condition Badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {item.kode_barang || 'TANPA KODE'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.kondisi === 'Baik'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.kondisi === 'Rusak Ringan'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.kondisi === 'Baik' ? (
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                  )}
                  <span>{item.kondisi}</span>
                </span>
              </div>

              {/* Body: Item Name, Category & Room */}
              <div>
                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded uppercase mb-1">
                  {item.kategori}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.nama_barang}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.ruangan}</span>
                  </div>
                  {item.tanggal_masuk && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.tanggal_masuk}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Unit Count, Funding Source & Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div>
                  <div className="text-base font-extrabold text-blue-700">
                    {item.jumlah} <span className="text-xs font-semibold text-slate-600">{item.satuan}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Sumber: {item.sumber_dana || '-'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditItem(item)}
                    title="Edit Data Barang"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Hapus Data Barang"
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Desktop Items Table (>= md) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-28">Kode Barang</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-3 w-32">Kategori</th>
                <th className="py-3 px-3 text-center w-20">Jumlah</th>
                <th className="py-3 px-3 text-center w-28">Kondisi</th>
                <th className="py-3 px-3 w-28">Ruangan</th>
                <th className="py-3 px-3 w-28">Sumber Dana</th>
                <th className="py-3 px-3 w-24">Tgl Masuk</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data stok barang...</span>
                    </div>
                  </td>
                </tr>
              ) : stokList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada barang yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                stokList.map((item, idx) => {
                  const itemIndex = pagination ? (pagination.page - 1) * pagination.limit + idx + 1 : idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {itemIndex}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700 uppercase">
                        {item.kode_barang || '-'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.nama_barang}</td>
                      <td className="py-3 px-3 font-medium text-slate-600 uppercase text-[11px]">
                        {item.kategori}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {item.jumlah} {item.satuan}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.kondisi === 'Baik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.kondisi === 'Rusak Ringan'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.kondisi}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{item.ruangan}</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">{item.sumber_dana || '-'}</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {item.tanggal_masuk || '-'}
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
      </div>

      {/* Pagination Controls (Visible for both Mobile & Desktop) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 shadow-2xs">
          <div>
            Menampilkan <span className="font-semibold text-slate-800">{stokList.length}</span> dari total{' '}
            <span className="font-semibold text-slate-800">{pagination.total}</span> barang (Halaman{' '}
            <span className="font-semibold text-slate-800">{pagination.page}</span> dari{' '}
            <span className="font-semibold text-slate-800">{pagination.totalPages}</span>)
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
  );
};

