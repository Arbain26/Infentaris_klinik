'use client';

import React from 'react';
import { Receipt, Boxes, Plus, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'transaksi' | 'stok';
  setActiveTab: (tab: 'transaksi' | 'stok') => void;
  onOpenAddModal: () => void;
  onOpenMobileSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenMobileSidebar,
}) => {
  return (
    <nav
      aria-label="Navigasi Bawah Mobile Floating Glass"
      className="lg:hidden fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 max-w-md mx-auto z-40"
    >
      {/* Outer Floating Liquid Glass Pill */}
      <div className="relative bg-white/75 backdrop-blur-2xl backdrop-saturate-200 border border-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.06),inset_0_1.5px_1px_rgba(255,255,255,0.95)] rounded-full px-3 py-1.5 transition-all">
        {/* Subtle top specular sheen reflection line */}
        <div className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent opacity-80 pointer-events-none" />

        <div className="flex items-center justify-between">
          {/* 1. Tab Kasir (Transaksi) */}
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all min-w-[70px] min-h-[46px] ${
              activeTab === 'transaksi'
                ? 'bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-500/25 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 font-medium active:scale-95'
            }`}
          >
            <Receipt
              className={`w-5 h-5 mb-0.5 transition-transform ${
                activeTab === 'transaksi'
                  ? 'text-emerald-600 scale-110'
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span className="text-[10px] tracking-tight">Kasir</span>
          </button>

          {/* 2. Center Liquid Action Button ("+") */}
          <div className="relative -top-3 flex items-center justify-center px-1">
            <button
              onClick={onOpenAddModal}
              title={activeTab === 'transaksi' ? 'Tambah Transaksi Baru' : 'Tambah Barang Baru'}
              className={`w-13 h-13 rounded-full flex items-center justify-center text-white ring-4 ring-white/90 shadow-xl transition-all duration-200 active:scale-90 active:rotate-45 ${
                activeTab === 'transaksi'
                  ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-emerald-500/40 shadow-[0_10px_25px_-3px_rgba(16,185,129,0.5),inset_0_1.5px_1px_rgba(255,255,255,0.7)]'
                  : 'bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 shadow-blue-500/40 shadow-[0_10px_25px_-3px_rgba(37,99,235,0.5),inset_0_1.5px_1px_rgba(255,255,255,0.7)]'
              }`}
            >
              <Plus className="w-6 h-6 stroke-[2.5] drop-shadow-xs" />
            </button>
          </div>

          {/* 3. Tab Inventaris (Stok) */}
          <button
            onClick={() => setActiveTab('stok')}
            className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all min-w-[70px] min-h-[46px] ${
              activeTab === 'stok'
                ? 'bg-blue-500/15 text-blue-800 font-bold border border-blue-500/25 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 font-medium active:scale-95'
            }`}
          >
            <Boxes
              className={`w-5 h-5 mb-0.5 transition-transform ${
                activeTab === 'stok'
                  ? 'text-blue-600 scale-110'
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span className="text-[10px] tracking-tight">Inventaris</span>
          </button>

          {/* 4. Menu Drawer Button */}
          <button
            onClick={onOpenMobileSidebar}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-full text-slate-500 hover:text-slate-800 font-medium transition-all min-w-[60px] min-h-[46px] active:scale-95"
          >
            <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
            <span className="text-[10px] tracking-tight">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
