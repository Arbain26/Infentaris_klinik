'use client';

import React from 'react';
import Image from 'next/image';
import { Settings, Download, PlusCircle, PackagePlus, RefreshCw } from 'lucide-react';
import { PengaturanKlinik } from '@/lib/types';

interface NavbarProps {
  pengaturan?: PengaturanKlinik | null;
  activeTab: 'transaksi' | 'stok';
  setActiveTab: (tab: 'transaksi' | 'stok') => void;
  onOpenPengaturan: () => void;
  onOpenAddTransaksi: () => void;
  onOpenAddStok: () => void;
  onOpenResetSaldo: () => void;
  onBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pengaturan,
  activeTab,
  setActiveTab,
  onOpenPengaturan,
  onOpenAddTransaksi,
  onOpenAddStok,
  onOpenResetSaldo,
  onBackup,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs">
              <Image
                src="/images/logo.png"
                alt="Logo Klinik"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {pengaturan?.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Laporan Keuangan &amp; Inventaris Klinik
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackup}
              title="Download Cadangan Data JSON"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Backup</span>
            </button>

            <button
              onClick={onOpenPengaturan}
              title="Pengaturan Profil Klinik & Penandatangan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Pengaturan</span>
            </button>

            {activeTab === 'transaksi' ? (
              <>
                <button
                  onClick={onOpenResetSaldo}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sesuaikan Saldo</span>
                </button>
                <button
                  onClick={onOpenAddTransaksi}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Transaksi</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAddStok}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-all active:scale-95"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Tambah Barang</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-t border-slate-100 -mb-px">
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'transaksi'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            💰 Transaksi Kas (Masuk &amp; Keluar)
          </button>
          <button
            onClick={() => setActiveTab('stok')}
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'stok'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            📦 Inventaris &amp; Stok Barang
          </button>
        </div>
      </div>
    </header>
  );
};
