'use client';

import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fileData, setFileData] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setFileData(parsed);
      } catch {
        setError('Format file tidak valid. Harap pilih file JSON cadangan klinik.');
        setFileData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!fileData) {
      setError('Pilih file cadangan terlebih dahulu');
      return;
    }

    if (!confirm('Peringatan: Pemulihan data akan memperbarui database dengan data dari berkas cadangan ini. Lanjutkan?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.restoreBackup(fileData);
      setSuccessMsg(res.message || 'Data cadangan berhasil dipulihkan.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal memulihkan data cadangan');
    } finally {
      setLoading(false);
    }
  };

  const rootData = fileData ? fileData.data || fileData : null;
  const countTransaksi = rootData?.transaksi ? (Array.isArray(rootData.transaksi) ? rootData.transaksi.length : 1) : 0;
  const countStok = rootData?.stok_barang ? (Array.isArray(rootData.stok_barang) ? rootData.stok_barang.length : 1) : 0;
  const hasPengaturan = Boolean(rootData?.pengaturan_klinik);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold">Pulihkan Cadangan Data (Restore)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
            <FileText className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-xs font-semibold text-slate-700">
              {fileName || 'Pilih Berkas JSON Cadangan'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              File backup_klinik_*.json
            </span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {fileData && (
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-indigo-950 block">Ringkasan Data dalam Berkas:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div className="p-2 bg-white rounded-lg border border-indigo-100/60">
                  <span className="text-slate-400 block text-[10px]">Transaksi Kas</span>
                  <span className="font-bold text-slate-900">{countTransaksi} baris</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100/60">
                  <span className="text-slate-400 block text-[10px]">Stok Barang</span>
                  <span className="font-bold text-slate-900">{countStok} aset</span>
                </div>
              </div>
              <div className="text-[11px] text-indigo-700">
                Profil klinik: {hasPengaturan ? 'Tersedia' : 'Default'}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!fileData || loading}
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memulihkan...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Pulihkan Data Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

