/**
 * ====================================================================
 * APP INITIALIZATION & TAB NAVIGATION
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

    function switchTab(tab) {
      currentTab = tab;
      const viewStokBarang = document.getElementById('viewStokBarang');
      const viewPengeluaran = document.getElementById('viewPengeluaran');
      const viewPemasukan = document.getElementById('viewPemasukan');
      const tabStokBtn = document.getElementById('tabStokBtn');
      const tabPengeluaranBtn = document.getElementById('tabPengeluaranBtn');
      const tabPemasukanBtn = document.getElementById('tabPemasukanBtn');

      if (tab === 'stok') {
        if (viewStokBarang) viewStokBarang.classList.remove('hidden');
        if (viewPengeluaran) viewPengeluaran.classList.add('hidden');
        if (viewPemasukan) viewPemasukan.classList.add('hidden');

        if (tabStokBtn) tabStokBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all bg-white text-indigo-900 shadow-sm whitespace-nowrap text-center';
        if (tabPengeluaranBtn) tabPengeluaranBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900 whitespace-nowrap text-center';
        if (tabPemasukanBtn) tabPemasukanBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900 whitespace-nowrap text-center';
      } else if (tab === 'pengeluaran') {
        if (viewStokBarang) viewStokBarang.classList.add('hidden');
        if (viewPengeluaran) viewPengeluaran.classList.remove('hidden');
        if (viewPemasukan) viewPemasukan.classList.add('hidden');

        if (tabPengeluaranBtn) tabPengeluaranBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all bg-white text-slate-900 shadow-sm whitespace-nowrap text-center';
        if (tabStokBtn) tabStokBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900 whitespace-nowrap text-center';
        if (tabPemasukanBtn) tabPemasukanBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900 whitespace-nowrap text-center';
      } else {
        if (viewStokBarang) viewStokBarang.classList.add('hidden');
        if (viewPengeluaran) viewPengeluaran.classList.add('hidden');
        if (viewPemasukan) viewPemasukan.classList.remove('hidden');

        if (tabPemasukanBtn) tabPemasukanBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all bg-white text-emerald-800 shadow-sm whitespace-nowrap text-center';
        if (tabStokBtn) tabStokBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900 whitespace-nowrap text-center';
        if (tabPengeluaranBtn) tabPengeluaranBtn.className = 'flex-1 sm:flex-none px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900 whitespace-nowrap text-center';
      }
    }

    // ====================================================================
    // LOGIKA STOK & BARANG TERSEDIA DI KLINIK (NON-KAS)
    // ====================================================================


    // Inisialisasi saat Halaman Dimuat
    document.addEventListener('DOMContentLoaded', async () => {
      await fetchPengaturan();
      await fetchTransaksi();
      await fetchStokBarang();
      switchTab('stok'); // Buka tab Stok & Barang Tersedia secara default

      // Registrasi PWA Service Worker untuk akses instan dan Add to Home Screen
      if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('PWA ServiceWorker registration notice:', err);
        });
      }
    });