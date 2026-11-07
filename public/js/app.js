/**
 * ====================================================================
 * APP INITIALIZATION & SIDEBAR NAVIGATION
 * Sistem Inventaris & Laporan Keuangan Klinik Aisyiyah Pangkajene
 * ====================================================================
 */

function switchTab(tab) {
  currentTab = tab;
  const viewStokBarang = document.getElementById('viewStokBarang');
  const viewPengeluaran = document.getElementById('viewPengeluaran');
  const viewPemasukan = document.getElementById('viewPemasukan');

  const sidebarBtnStok = document.getElementById('sidebarBtnStok');
  const sidebarBtnPengeluaran = document.getElementById('sidebarBtnPengeluaran');
  const sidebarBtnPemasukan = document.getElementById('sidebarBtnPemasukan');

  const headerViewTitle = document.getElementById('headerViewTitle');
  const headerViewBadge = document.getElementById('headerViewBadge');

  const baseInactive = 'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-left';
  const badgeInactive = 'text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600';

  if (tab === 'stok') {
    if (viewStokBarang) viewStokBarang.classList.remove('hidden');
    if (viewPengeluaran) viewPengeluaran.classList.add('hidden');
    if (viewPemasukan) viewPemasukan.classList.add('hidden');

    if (sidebarBtnStok) {
      sidebarBtnStok.className = 'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all bg-indigo-600 text-white shadow-md shadow-indigo-600/25 text-left';
      const b = sidebarBtnStok.querySelector('.nav-badge');
      if (b) b.className = 'nav-badge text-[11px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white';
    }
    if (sidebarBtnPengeluaran) {
      sidebarBtnPengeluaran.className = baseInactive;
      const b = sidebarBtnPengeluaran.querySelector('.nav-badge');
      if (b) b.className = `nav-badge ${badgeInactive}`;
    }
    if (sidebarBtnPemasukan) {
      sidebarBtnPemasukan.className = baseInactive;
      const b = sidebarBtnPemasukan.querySelector('.nav-badge');
      if (b) b.className = `nav-badge ${badgeInactive}`;
    }

    if (headerViewTitle) headerViewTitle.innerText = 'Stok & Barang Tersedia (Klinik)';
    if (headerViewBadge) {
      headerViewBadge.className = 'hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800';
      headerViewBadge.innerText = 'Non-Kas / Stok Fisik';
    }
  } else if (tab === 'pengeluaran') {
    if (viewStokBarang) viewStokBarang.classList.add('hidden');
    if (viewPengeluaran) viewPengeluaran.classList.remove('hidden');
    if (viewPemasukan) viewPemasukan.classList.add('hidden');

    if (sidebarBtnPengeluaran) {
      sidebarBtnPengeluaran.className = 'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all bg-rose-600 text-white shadow-md shadow-rose-600/25 text-left';
      const b = sidebarBtnPengeluaran.querySelector('.nav-badge');
      if (b) b.className = 'nav-badge text-[11px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white';
    }
    if (sidebarBtnStok) {
      sidebarBtnStok.className = baseInactive;
      const b = sidebarBtnStok.querySelector('.nav-badge');
      if (b) b.className = `nav-badge ${badgeInactive}`;
    }
    if (sidebarBtnPemasukan) {
      sidebarBtnPemasukan.className = baseInactive;
      const b = sidebarBtnPemasukan.querySelector('.nav-badge');
      if (b) b.className = `nav-badge ${badgeInactive}`;
    }

    if (headerViewTitle) headerViewTitle.innerText = 'Laporan Inventaris & Pengeluaran';
    if (headerViewBadge) {
      headerViewBadge.className = 'hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800';
      headerViewBadge.innerText = 'Arus Kas Keluar';
    }
  } else {
    if (viewStokBarang) viewStokBarang.classList.add('hidden');
    if (viewPengeluaran) viewPengeluaran.classList.add('hidden');
    if (viewPemasukan) viewPemasukan.classList.remove('hidden');

    if (sidebarBtnPemasukan) {
      sidebarBtnPemasukan.className = 'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all bg-emerald-600 text-white shadow-md shadow-emerald-600/25 text-left';
      const b = sidebarBtnPemasukan.querySelector('.nav-badge');
      if (b) b.className = 'nav-badge text-[11px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white';
    }
    if (sidebarBtnStok) {
      sidebarBtnStok.className = baseInactive;
      const b = sidebarBtnStok.querySelector('.nav-badge');
      if (b) b.className = `nav-badge ${badgeInactive}`;
    }
    if (sidebarBtnPengeluaran) {
      sidebarBtnPengeluaran.className = baseInactive;
      const b = sidebarBtnPengeluaran.querySelector('.nav-badge');
      if (b) b.className = `nav-badge ${badgeInactive}`;
    }

    if (headerViewTitle) headerViewTitle.innerText = 'Dana Masuk / Pemasukan Kas';
    if (headerViewBadge) {
      headerViewBadge.className = 'hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800';
      headerViewBadge.innerText = 'Arus Kas Masuk';
    }
  }
}

// Sidebar Drawer Toggle untuk Mobile / Tablet
function toggleSidebar(show) {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar || !backdrop) return;

  if (show) {
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
  } else {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
  }
}

function closeMobileSidebar() {
  if (window.innerWidth < 1024) {
    toggleSidebar(false);
  }
}

// Sinkronisasi Angka Badge di Menu Sidebar
function updateSidebarBadges() {
  const badgeStok = document.getElementById('sidebarBadgeStok');
  const badgePengeluaran = document.getElementById('sidebarBadgePengeluaran');
  const badgePemasukan = document.getElementById('sidebarBadgePemasukan');

  if (badgeStok && typeof allStokBarang !== 'undefined') {
    badgeStok.innerText = allStokBarang.length;
  }
  if (typeof allTransactions !== 'undefined') {
    if (badgePengeluaran) {
      badgePengeluaran.innerText = allTransactions.filter(t => t.jenis === 'Pengeluaran').length;
    }
    if (badgePemasukan) {
      badgePemasukan.innerText = allTransactions.filter(t => t.jenis === 'Pemasukan').length;
    }
  }
}

// Inisialisasi saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', async () => {
  await fetchPengaturan();
  await fetchTransaksi();
  await fetchStokBarang();
  updateSidebarBadges();
  switchTab('stok'); // Buka tab Stok & Barang Tersedia secara default

  // Registrasi PWA Service Worker untuk akses instan dan Add to Home Screen
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('PWA ServiceWorker registration notice:', err);
    });
  }
});
