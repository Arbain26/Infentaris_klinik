'use client';

import React from 'react';
import { X, Smartphone, Download, Share2, Laptop, CheckCircle2 } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  canNativeInstall: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canNativeInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pasang Aplikasi (PWA)</h2>
              <p className="text-xs text-slate-500 font-medium">Install ke Layar Utama HP / Desktop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Direct Install Button if supported */}
          {canNativeInstall && onNativeInstall ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-center space-y-3">
              <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                Browser Anda mendukung instalasi otomatis satu ketukan!
              </p>
              <button
                onClick={() => {
                  onNativeInstall();
                  onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Pasang Aplikasi Sekarang</span>
              </button>
            </div>
          ) : null}

          {/* Platform Guides */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Panduan Pemasangan Manual
            </h3>

            {/* Android / Chrome */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Pengguna Android &amp; Google Chrome:</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1 pl-6 list-decimal leading-relaxed">
                <li>Ketuk menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.</li>
                <li>Pilih <strong>&quot;Instal aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.</li>
                <li>Ketuk <strong>&quot;Instal&quot;</strong> pada dialog konfirmasi.</li>
              </ol>
            </div>

            {/* iOS / Safari */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Pengguna iPhone / iPad (Apple Safari):</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1 pl-6 list-decimal leading-relaxed">
                <li>Buka situs di browser <strong>Safari</strong>.</li>
                <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah (ikon kotak dengan panah atas).</li>
                <li>Gulir ke bawah dan ketuk <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.</li>
                <li>Ketuk <strong>&quot;Tambah&quot; (Add)</strong> di pojok kanan atas.</li>
              </ol>
            </div>

            {/* Laptop / PC Desktop */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Laptop className="w-4 h-4 text-slate-700" />
                <span>Pengguna Komputer / Laptop (Chrome / Edge):</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Klik ikon <strong>Instal Aplikasi</strong> (gambar komputer kecil dengan panah ke bawah) yang muncul di ujung kanan bilah alamat (URL bar) browser Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mendukung mode offline &amp; buka layar penuh</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
