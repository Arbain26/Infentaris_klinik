'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { TransaksiView } from '@/components/TransaksiView';
import { StokView } from '@/components/StokView';
import { TransaksiModal } from '@/components/TransaksiModal';
import { StokModal } from '@/components/StokModal';
import { ResetSaldoModal } from '@/components/ResetSaldoModal';
import { PengaturanModal } from '@/components/PengaturanModal';
import { RestoreModal } from '@/components/RestoreModal';
import { PengaturanKlinik, Transaksi, StokBarang } from '@/lib/types';
import { api } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'stok'>('transaksi');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [pengaturan, setPengaturan] = useState<PengaturanKlinik | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Modals state
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(false);
  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);
  const [editingTransaksi, setEditingTransaksi] = useState<Transaksi | null>(null);
  const [isStokModalOpen, setIsStokModalOpen] = useState(false);
  const [editingStok, setEditingStok] = useState<StokBarang | null>(null);
  const [isResetSaldoOpen, setIsResetSaldoOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Current balance for reset modal
  const [currentSaldo, setCurrentSaldo] = useState<number>(0);

  // PWA Service Worker Registration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA Service Worker registration notice:', err);
        });
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pengaturanData, categoriesData, txRes] = await Promise.all([
        api.getPengaturan(),
        api.getKategori(),
        api.getTransaksi(),
      ]);
      setPengaturan(pengaturanData);
      setCategories(categoriesData);

      let masuk = 0;
      let keluar = 0;
      (txRes.data || []).forEach((t) => {
        const nom = Number(t.nominal) || 0;
        if (t.jenis === 'Pemasukan') masuk += nom;
        else keluar += nom;
      });
      setCurrentSaldo(masuk - keluar);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [refreshTrigger]);

  const handleBackup = () => {
    const url = api.getBackupUrl();
    window.open(url, '_blank');
  };

  const handleTriggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* 1. Left Sidebar Navigation (Desktop Fixed, Mobile Slide-over) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pengaturan={pengaturan}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAddTransaksi={() => {
          setEditingTransaksi(null);
          setIsTransaksiModalOpen(true);
        }}
        onOpenAddStok={() => {
          setEditingStok(null);
          setIsStokModalOpen(true);
        }}
        onOpenResetSaldo={() => setIsResetSaldoOpen(true)}
        onOpenBackup={handleBackup}
        onOpenRestore={() => setIsRestoreModalOpen(true)}
        onOpenPengaturan={() => setIsPengaturanOpen(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          pengaturan={pengaturan}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenAddTransaksi={() => {
            setEditingTransaksi(null);
            setIsTransaksiModalOpen(true);
          }}
          onOpenAddStok={() => {
            setEditingStok(null);
            setIsStokModalOpen(true);
          }}
          onOpenResetSaldo={() => setIsResetSaldoOpen(true)}
          onOpenBackup={handleBackup}
          onOpenRestore={() => setIsRestoreModalOpen(true)}
          onOpenPengaturan={() => setIsPengaturanOpen(true)}
        />

        {/* View Contents */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          {activeTab === 'transaksi' ? (
            <TransaksiView
              pengaturan={pengaturan}
              categories={categories}
              onOpenAddModal={() => {
                setEditingTransaksi(null);
                setIsTransaksiModalOpen(true);
              }}
              onOpenResetSaldo={() => setIsResetSaldoOpen(true)}
              onEditItem={(item) => {
                setEditingTransaksi(item);
                setIsTransaksiModalOpen(true);
              }}
              refreshTrigger={refreshTrigger}
              onTriggerRefresh={handleTriggerRefresh}
            />
          ) : (
            <StokView
              pengaturan={pengaturan}
              onOpenAddModal={() => {
                setEditingStok(null);
                setIsStokModalOpen(true);
              }}
              onEditItem={(item) => {
                setEditingStok(item);
                setIsStokModalOpen(true);
              }}
              refreshTrigger={refreshTrigger}
              onTriggerRefresh={handleTriggerRefresh}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 mb-16 lg:mb-0">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <strong className="text-slate-700">
              {pengaturan?.nama_klinik || 'Klinik Pratama Aisyiyah Pangkajene'}
            </strong>
            . Sistem Laporan Keuangan &amp; Inventaris Klinik.
          </p>
        </footer>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (< lg) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          if (activeTab === 'transaksi') {
            setEditingTransaksi(null);
            setIsTransaksiModalOpen(true);
          } else {
            setEditingStok(null);
            setIsStokModalOpen(true);
          }
        }}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* 3. Global Modals */}
      <PengaturanModal
        isOpen={isPengaturanOpen}
        onClose={() => setIsPengaturanOpen(false)}
        pengaturan={pengaturan}
        onSuccess={(updated) => {
          setPengaturan(updated);
          handleTriggerRefresh();
        }}
      />

      <TransaksiModal
        isOpen={isTransaksiModalOpen}
        onClose={() => setIsTransaksiModalOpen(false)}
        initialData={editingTransaksi}
        categories={categories}
        onSuccess={handleTriggerRefresh}
      />

      <StokModal
        isOpen={isStokModalOpen}
        onClose={() => setIsStokModalOpen(false)}
        initialData={editingStok}
        onSuccess={handleTriggerRefresh}
      />

      <ResetSaldoModal
        isOpen={isResetSaldoOpen}
        onClose={() => setIsResetSaldoOpen(false)}
        currentSaldo={currentSaldo}
        onSuccess={handleTriggerRefresh}
      />

      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onSuccess={handleTriggerRefresh}
      />
    </div>
  );
}
