'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Camera, Trash2 } from 'lucide-react';
import { Transaksi } from '@/lib/types';
import { api } from '@/lib/api';

interface TransaksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaksi | null;
  categories: string[];
  onSuccess: () => void;
}

export const TransaksiModal: React.FC<TransaksiModalProps> = ({
  isOpen,
  onClose,
  initialData,
  categories,
  onSuccess,
}) => {
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [jenis, setJenis] = useState<'Pengeluaran' | 'Pemasukan'>('Pengeluaran');
  const [kategori, setKategori] = useState<string>('');
  const [uraian, setUraian] = useState<string>('');
  const [volume, setVolume] = useState<number>(1);
  const [satuan, setSatuan] = useState<string>('Unit');
  const [hargaSatuan, setHargaSatuan] = useState<number>(0);
  const [nominal, setNominal] = useState<number>(0);
  const [metode, setMetode] = useState<string>('Tunai');
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTanggal(initialData.tanggal);
      setJenis(initialData.jenis);
      setKategori(initialData.kategori);
      setUraian(initialData.uraian);
      setVolume(initialData.volume || 1);
      setSatuan(initialData.satuan || 'Unit');
      setHargaSatuan(initialData.harga_satuan || 0);
      setNominal(initialData.nominal || 0);
      setMetode(initialData.metode || 'Tunai');
      setFotoBukti(initialData.foto_bukti || null);
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setJenis('Pengeluaran');
      setKategori(categories[0] || 'OBAT & BHP');
      setUraian('');
      setVolume(1);
      setSatuan('Unit');
      setHargaSatuan(0);
      setNominal(0);
      setMetode('Tunai');
      setFotoBukti(null);
    }
    setError(null);
  }, [initialData, categories, isOpen]);

  if (!isOpen) return null;

  // Auto calculate nominal when volume or hargaSatuan changes
  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (hargaSatuan > 0) {
      setNominal(v * hargaSatuan);
    }
  };

  const handleHargaSatuanChange = (p: number) => {
    setHargaSatuan(p);
    if (volume > 0) {
      setNominal(volume * p);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFotoBukti(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!tanggal || !kategori || !uraian) {
      setError('Harap lengkapi semua field bertanda bintang (*)');
      setLoading(false);
      return;
    }

    const payload: Partial<Transaksi> = {
      tanggal,
      jenis,
      kategori,
      uraian,
      volume,
      satuan,
      harga_satuan: hargaSatuan,
      nominal,
      metode,
      foto_bukti: fotoBukti,
    };

    try {
      if (initialData?.id) {
        await api.updateTransaksi(initialData.id, payload);
      } else {
        await api.createTransaksi(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800">
            {initialData ? 'Edit Data Transaksi' : 'Tambah Transaksi Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Jenis Transaksi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJenis('Pengeluaran')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  jenis === 'Pengeluaran'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔴 Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setJenis('Pemasukan')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  jenis === 'Pemasukan'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🟢 Pemasukan
              </button>
            </div>
          </div>

          {/* Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori *</label>
              <input
                type="text"
                list="kategori-list"
                required
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                placeholder="Pilih atau ketik kategori..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <datalist id="kategori-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Uraian */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uraian / Jenis Barang / Keperluan *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Pembelian Kassa Steril 10 box..."
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Volume, Satuan, Harga Satuan */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
              <input
                type="number"
                min="1"
                value={volume}
                onChange={(e) => handleVolumeChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
              <input
                type="text"
                value={satuan}
                placeholder="Box / Unit"
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Satuan</label>
              <input
                type="number"
                min="0"
                value={hargaSatuan}
                onChange={(e) =>
                  handleHargaSatuanChange(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Total Nominal & Metode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Nominal (Rp) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={nominal}
                onChange={(e) => setNominal(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 text-sm font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Tunai">Tunai / Kasir</option>
                <option value="Transfer">Transfer Bank</option>
              </select>
            </div>
          </div>

          {/* Upload Bukti Nota / Foto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Lampiran Bukti Nota / Kwitansi (Opsional)</span>
              {fotoBukti && (
                <button
                  type="button"
                  onClick={() => setFotoBukti(null)}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Foto</span>
                </button>
              )}
            </label>

            {fotoBukti ? (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden max-h-48 bg-slate-50 flex items-center justify-center">
                <img
                  src={fotoBukti}
                  alt="Bukti Nota"
                  className="max-h-48 object-contain w-full"
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-colors">
                <Camera className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-600">
                  Ambil Foto atau Pilih File Nota
                </span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WEBP hingga 8MB</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Footer Submit */}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

