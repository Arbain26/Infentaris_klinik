'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Building2, UserCheck } from 'lucide-react';
import { PengaturanKlinik } from '@/lib/types';
import { api } from '@/lib/api';

interface PengaturanModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengaturan: PengaturanKlinik | null;
  onSuccess: (updated: PengaturanKlinik) => void;
}

export const PengaturanModal: React.FC<PengaturanModalProps> = ({
  isOpen,
  onClose,
  pengaturan,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<PengaturanKlinik>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pengaturan) {
      setFormData(pengaturan);
    }
  }, [pengaturan]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updatePengaturan(formData);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold">Pengaturan Klinik &amp; Penandatangan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Profil Klinik */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Identitas &amp; Alamat Klinik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Resmi Klinik
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_klinik || ''}
                  onChange={(e) => setFormData({ ...formData, nama_klinik: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  required
                  value={formData.kota || ''}
                  onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={formData.telepon || ''}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Penandatangan Dokumen */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Pejabat Penandatangan Laporan (PDF &amp; Excel)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pihak Kiri (Pimpinan) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Pihak Pertama (Kiri - Pimpinan)
                </span>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={formData.jabatan_kiri || ''}
                    onChange={(e) => setFormData({ ...formData, jabatan_kiri: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    value={formData.nama_kiri || ''}
                    onChange={(e) => setFormData({ ...formData, nama_kiri: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">NIP / SIP / ID</label>
                  <input
                    type="text"
                    value={formData.nip_kiri || ''}
                    onChange={(e) => setFormData({ ...formData, nip_kiri: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              {/* Pihak Kanan (Petugas/Pengelola) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Pihak Kedua (Kanan - Petugas)
                </span>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={formData.jabatan_kanan || ''}
                    onChange={(e) => setFormData({ ...formData, jabatan_kanan: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    value={formData.nama_kanan || ''}
                    onChange={(e) => setFormData({ ...formData, nama_kanan: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                </div>
              </div>
            </div>
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
              <span>{loading ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
