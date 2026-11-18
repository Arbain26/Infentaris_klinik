'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, PackagePlus } from 'lucide-react';
import { StokBarang } from '@/lib/types';
import { api } from '@/lib/api';

interface StokModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StokBarang | null;
  onSuccess: () => void;
}

export const StokModal: React.FC<StokModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const [kodeBarang, setKodeBarang] = useState<string>('');
  const [namaBarang, setNamaBarang] = useState<string>('');
  const [kategori, setKategori] = useState<string>('ALAT MEDIS');
  const [jumlah, setJumlah] = useState<number>(1);
  const [satuan, setSatuan] = useState<string>('Unit');
  const [kondisi, setKondisi] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [ruangan, setRuangan] = useState<string>('Poli Umum');
  const [sumberDana, setSumberDana] = useState<string>('Klinik');
  const [tanggalMasuk, setTanggalMasuk] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [keterangan, setKeterangan] = useState<string>('Stok Awal Klinik');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setKodeBarang(initialData.kode_barang || '');
      setNamaBarang(initialData.nama_barang);
      setKategori(initialData.kategori);
      setJumlah(initialData.jumlah);
      setSatuan(initialData.satuan);
      setKondisi(initialData.kondisi);
      setRuangan(initialData.ruangan);
      setSumberDana(initialData.sumber_dana || 'Klinik');
      setTanggalMasuk(
        initialData.tanggal_masuk || new Date().toISOString().split('T')[0]
      );
      setKeterangan(initialData.keterangan || '');
    } else {
      setKodeBarang(`BRG-${Math.floor(1000 + Math.random() * 9000)}`);
      setNamaBarang('');
      setKategori('ALAT MEDIS');
      setJumlah(1);
      setSatuan('Unit');
      setKondisi('Baik');
      setRuangan('Poli Umum');
      setSumberDana('Klinik');
      setTanggalMasuk(new Date().toISOString().split('T')[0]);
      setKeterangan('Stok Awal Klinik');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!namaBarang || !kategori) {
      setError('Nama barang dan kategori wajib diisi');
      setLoading(false);
      return;
    }

    const payload: Partial<StokBarang> = {
      kode_barang: kodeBarang.trim().toUpperCase(),
      nama_barang: namaBarang.trim(),
      kategori: kategori.trim().toUpperCase(),
      jumlah,
      satuan: satuan.trim(),
      kondisi,
      ruangan: ruangan.trim(),
      sumber_dana: sumberDana.trim(),
      tanggal_masuk: tanggalMasuk,
      keterangan: keterangan.trim(),
    };

    try {
      if (initialData?.id) {
        await api.updateStokBarang(initialData.id, payload);
      } else {
        await api.createStokBarang(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data barang');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <PackagePlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold">
              {initialData ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Barang / Barcode
              </label>
              <input
                type="text"
                required
                value={kodeBarang}
                onChange={(e) => setKodeBarang(e.target.value)}
                className="w-full px-3 py-2 text-sm uppercase font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Barang *
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALAT MEDIS">ALAT MEDIS</option>
                <option value="ALAT KANTOR">ALAT KANTOR</option>
                <option value="ALAT LISTRIK">ALAT LISTRIK</option>
                <option value="ALAT KEBERSIHAN">ALAT KEBERSIHAN</option>
                <option value="MEUBEL & ASET">MEUBEL &amp; ASET</option>
                <option value="OBAT & BHP">OBAT &amp; BHP</option>
                <option value="LAINNYA">LAINNYA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Barang / Merk *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tensimeter Digital Omron HEM-7120"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
              <input
                type="number"
                min="0"
                value={jumlah}
                onChange={(e) => setJumlah(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
              <input
                type="text"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Fisik</label>
              <select
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Ruangan Penempatan
              </label>
              <input
                type="text"
                value={ruangan}
                placeholder="Poli Umum / Farmasi / Kasir"
                onChange={(e) => setRuangan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sumber Anggaran / Dana
              </label>
              <input
                type="text"
                value={sumberDana}
                placeholder="Klinik / Yayasan / Hibah"
                onChange={(e) => setSumberDana(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Masuk</label>
            <input
              type="date"
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan Tambahan / Spesifikasi
            </label>
            <textarea
              rows={2}
              value={keterangan}
              placeholder="Catatan tambahan spesifikasi atau nomor seri..."
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Barang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

