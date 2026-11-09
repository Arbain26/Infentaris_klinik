'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { TransaksiView } from '@/components/TransaksiView';
import { StokView } from '@/components/StokView';
import { TransaksiModal } from '@/components/TransaksiModal';
import { StokModal } from '@/components/StokModal';
import { ResetSaldoModal } from '@/components/ResetSaldoModal';
import { PengaturanModal } from '@/components/PengaturanModal';
import { PengaturanKlinik, Transaksi, StokBarang } from '@/lib/types';
import { api } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'stok'>('transaksi');
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

  // Current balance for reset modal
  const [currentSaldo, setCurrentSaldo] = useState<number>(0);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navbar Header */}
      <Navbar
        pengaturan={pengaturan}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPengaturan={() => setIsPengaturanOpen(true)}
        onOpenAddTransaksi={() => {
          setEditingTransaksi(null);
          setIsTransaksiModalOpen(true);
        }}
        onOpenAddStok={() => {
          setEditingStok(null);
          setIsStokModalOpen(true);
        }}
        onOpenResetSaldo={() => setIsResetSaldoOpen(true)}
        onBackup={handleBackup}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()}{' '}
          <strong className="text-slate-700">
            {pengaturan?.nama_klinik || 'Klinik Pratama Aisyiyah Pangkajene'}
          </strong>
          . Seluruh hak cipta dilindungi.
        </p>
      </footer>

      {/* Modals */}
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
    </div>
  );
}
