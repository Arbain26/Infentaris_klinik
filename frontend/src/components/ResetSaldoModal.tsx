'use client';

import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

interface ResetSaldoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSaldo: number;
  onSuccess: () => void;
}

export const ResetSaldoModal: React.FC<ResetSaldoModalProps> = ({
  isOpen,
  onClose,
  currentSaldo,
  onSuccess,
}) => {
  const [targetSaldo, setTargetSaldo] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState<string>('Saldo Awal Kas Klinik');
  const [mode, setMode] = useState<'selisih' | 'bersihkan_dan_set'>('selisih');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedTarget = parseInt(targetSaldo.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsedTarget) || parsedTarget < 0) {
      setError('Nominal saldo baru harus berupa angka positif');
      setLoading(false);
      return;
    }

    try {
      await api.resetSaldo({
        target_saldo: parsedTarget,
        tanggal,
        keterangan,
        mode,
      });

      // Launch celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyesuaikan saldo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-900">
            <RefreshCw className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold">Sesuaikan / Atur Ulang Saldo Kas</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
            <span className="text-xs text-slate-500 font-medium block mb-0.5">Saldo Kas Saat Ini</span>
            <span className="text-lg font-bold text-slate-800">{formatRupiah(currentSaldo)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Saldo Target Baru (Rp)
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="Contoh: 15000000"
              value={targetSaldo}
              onChange={(e) => setTargetSaldo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Efektif</label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Uraian / Keterangan</label>
            <input
              type="text"
              required
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Metode Penyesuaian</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="selisih"
                  checked={mode === 'selisih'}
                  onChange={() => setMode('selisih')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Penyesuaian Selisih (Disarankan)</span>
                  <span className="text-[11px] text-slate-500">
                    Menyisipkan 1 transaksi baru sebesar selisih tanpa menghapus riwayat transaksi lama.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="bersihkan_dan_set"
                  checked={mode === 'bersihkan_dan_set'}
                  onChange={() => setMode('bersihkan_dan_set')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Reset Bersih Pemasukan</span>
                  <span className="text-[11px] text-slate-500">
                    Menghapus data pemasukan lama dan menyetel ulang saldo awal bersih.
                  </span>
                </div>
              </label>
            </div>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Memproses...' : 'Terapkan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
