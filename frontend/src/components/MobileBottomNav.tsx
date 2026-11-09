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
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab Transaksi */}
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] ${
            activeTab === 'transaksi'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          <Receipt
            className={`w-5 h-5 mb-0.5 ${
              activeTab === 'transaksi' ? 'text-emerald-600 scale-110' : 'text-slate-400'
            }`}
          />
          <span className="text-[10px] tracking-tight">Kasir</span>
        </button>

        {/* Center Quick Add FAB */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={onOpenAddModal}
            title={activeTab === 'transaksi' ? 'Tambah Transaksi Baru' : 'Tambah Barang Baru'}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
              activeTab === 'transaksi'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 ring-4 ring-white'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 ring-4 ring-white'
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Stok */}
        <button
          onClick={() => setActiveTab('stok')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] ${
            activeTab === 'stok'
              ? 'text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          <Boxes
            className={`w-5 h-5 mb-0.5 ${
              activeTab === 'stok' ? 'text-blue-600 scale-110' : 'text-slate-400'
            }`}
          />
          <span className="text-[10px] tracking-tight">Inventaris</span>
        </button>

        {/* Menu Drawer Toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all min-w-[64px] min-h-[44px]"
        >
          <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
