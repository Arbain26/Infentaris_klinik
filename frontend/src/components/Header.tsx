'use client';

import React from 'react';
import { Menu, PlusCircle, PackagePlus, RefreshCw, Settings, Download, UploadCloud } from 'lucide-react';
import { PengaturanKlinik } from '@/lib/types';

interface HeaderProps {
  activeTab: 'transaksi' | 'stok';
  pengaturan?: PengaturanKlinik | null;
  onOpenMobileMenu: () => void;
  onOpenAddTransaksi: () => void;
  onOpenAddStok: () => void;
  onOpenResetSaldo: () => void;
  onOpenBackup: () => void;
  onOpenRestore: () => void;
  onOpenPengaturan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  pengaturan,
  onOpenMobileMenu,
  onOpenAddTransaksi,
  onOpenAddStok,
  onOpenResetSaldo,
  onOpenBackup,
  onOpenRestore,
  onOpenPengaturan,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/75 backdrop-blur-xl backdrop-saturate-150 border-b border-white/60 shadow-[0_4px_24px_rgba(15,23,42,0.04),inset_0_-1px_0_rgba(255,255,255,0.8)] transition-all">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Hamburger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {activeTab === 'transaksi'
                    ? 'Buku Kas & Transaksi'
                    : 'Buku Induk Inventaris Barang'}
                </h2>
                <span
                  className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'transaksi'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {activeTab === 'transaksi' ? 'Keuangan' : 'Aset Fisik'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {pengaturan?.nama_klinik || 'Klinik Pratama Aisyiyah Pangkajene'}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBackup}
              title="Unduh Cadangan JSON"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Backup</span>
            </button>

            <button
              onClick={onOpenRestore}
              title="Pulihkan Data Cadangan JSON"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Restore</span>
            </button>

            <button
              onClick={onOpenPengaturan}
              title="Pengaturan Klinik"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Pengaturan</span>
            </button>

            {activeTab === 'transaksi' ? (
              <>
                <button
                  onClick={onOpenResetSaldo}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sesuaikan Saldo</span>
                </button>

                <button
                  onClick={onOpenAddTransaksi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah Transaksi</span>
                  <span className="sm:hidden font-bold">Transaksi</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAddStok}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-all active:scale-95"
              >
                <PackagePlus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah Barang</span>
                <span className="sm:hidden font-bold">Barang</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

