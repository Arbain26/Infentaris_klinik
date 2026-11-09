'use client';

import React from 'react';
import Image from 'next/image';
import {
  Receipt,
  Boxes,
  PlusCircle,
  PackagePlus,
  RefreshCw,
  Download,
  UploadCloud,
  Settings,
  X,
} from 'lucide-react';
import { PengaturanKlinik } from '@/lib/types';

interface SidebarProps {
  activeTab: 'transaksi' | 'stok';
  setActiveTab: (tab: 'transaksi' | 'stok') => void;
  pengaturan?: PengaturanKlinik | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAddTransaksi: () => void;
  onOpenAddStok: () => void;
  onOpenResetSaldo: () => void;
  onOpenBackup: () => void;
  onOpenRestore: () => void;
  onOpenPengaturan: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pengaturan,
  isOpenMobile,
  onCloseMobile,
  onOpenAddTransaksi,
  onOpenAddStok,
  onOpenResetSaldo,
  onOpenBackup,
  onOpenRestore,
  onOpenPengaturan,
}) => {
  const navContent = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Image
              src="/images/logo.png"
              alt="Logo Klinik"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">
              {pengaturan?.nama_klinik || 'KLINIK AISYIYAH'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Sistem Kas &amp; Inventaris
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Main Menu */}
        <div>
          <span className="block px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Menu Utama
          </span>
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('transaksi');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'transaksi'
                  ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt
                  className={`w-4 h-4 ${
                    activeTab === 'transaksi' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>Transaksi Kas</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  activeTab === 'transaksi'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                Kasir
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('stok');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'stok'
                  ? 'bg-blue-50 text-blue-800 border-l-4 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes
                  className={`w-4 h-4 ${
                    activeTab === 'stok' ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>Inventaris &amp; Stok</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  activeTab === 'stok'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                Aset
              </span>
            </button>
          </nav>
        </div>

        {/* Quick Actions */}
        <div>
          <span className="block px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Aksi Cepat
          </span>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenAddTransaksi();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Tambah Transaksi</span>
            </button>

            <button
              onClick={() => {
                onOpenAddStok();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <PackagePlus className="w-4 h-4 text-blue-600" />
              <span>Tambah Barang / Aset</span>
            </button>

            <button
              onClick={() => {
                onOpenResetSaldo();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Sesuaikan Saldo Kas</span>
            </button>
          </div>
        </div>

        {/* System & Data Management */}
        <div>
          <span className="block px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Cadangan &amp; Sistem
          </span>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenBackup();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Unduh Cadangan (JSON)</span>
            </button>

            <button
              onClick={() => {
                onOpenRestore();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Pulihkan / Restore Data</span>
            </button>

            <button
              onClick={() => {
                onOpenPengaturan();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Pengaturan Klinik</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info in Sidebar */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-700 leading-tight">
              Sistem Aktif &amp; Terhubung
            </span>
            <span className="block text-[10px] text-slate-400 truncate">
              Database Prisma MySQL
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200/80 shadow-2xs z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Mobile Drawer Off-Canvas */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
};

