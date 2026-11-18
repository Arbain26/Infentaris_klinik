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

// ====================================================================
// FITUR CADANGAN & SISTEM (EXCEL, PDF, JSON, RESTORE, PWA)
// ====================================================================

// 1. Unduh Cadangan Database Lengkap ke Excel (.xlsx)
async function unduhCadanganExcel() {
  showToast('Menyiapkan file cadangan database Excel...', 'info');
  try {
    const response = await fetch('/api/system/backup-excel');
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `backup_klinik_lengkap_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Cadangan database Excel berhasil diunduh!', 'success');
      return;
    }
    
    // Client-side fallback jika backend endpoint sedang tidak tersedia
    if (typeof ExcelJS !== 'undefined') {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Klinik Aisyiyah Pangkajene';
      
      const wsTx = wb.addWorksheet('Data Transaksi Kas', { views: [{ showGridLines: true }] });
      wsTx.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Tanggal', key: 'tanggal', width: 14 },
        { header: 'Jenis', key: 'jenis', width: 14 },
        { header: 'Kategori', key: 'kategori', width: 22 },
        { header: 'Uraian', key: 'uraian', width: 36 },
        { header: 'Satuan', key: 'satuan', width: 10 },
        { header: 'Nominal (Rp)', key: 'nominal', width: 18 },
        { header: 'Metode', key: 'metode', width: 12 }
      ];
      (allTransactions || []).forEach(t => {
        wsTx.addRow({
          id: t.id,
          tanggal: t.tanggal,
          jenis: t.jenis,
          kategori: t.kategori,
          uraian: t.uraian,
          satuan: t.satuan || '-',
          nominal: Number(t.nominal || 0),
          metode: t.metode || 'Tunai'
        });
      });
      
      const wsStok = wb.addWorksheet('Stok Barang Klinik', { views: [{ showGridLines: true }] });
      wsStok.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Kode', key: 'kode_barang', width: 14 },
        { header: 'Nama Barang', key: 'nama_barang', width: 35 },
        { header: 'Kategori', key: 'kategori', width: 20 },
        { header: 'Jumlah', key: 'jumlah', width: 12 },
        { header: 'Satuan', key: 'satuan', width: 10 },
        { header: 'Kondisi', key: 'kondisi', width: 14 },
        { header: 'Ruangan', key: 'ruangan', width: 20 }
      ];
      (allStokBarang || []).forEach(s => {
        wsStok.addRow({
          id: s.id,
          kode_barang: s.kode_barang || '-',
          nama_barang: s.nama_barang,
          kategori: s.kategori,
          jumlah: Number(s.jumlah || 0),
          satuan: s.satuan || 'unit',
          kondisi: s.kondisi || 'Baik',
          ruangan: s.ruangan || '-'
        });
      });
      
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `backup_klinik_lengkap_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Cadangan database Excel berhasil diunduh!', 'success');
    }
  } catch (err) {
    console.error('Error unduh cadangan Excel:', err);
    showToast('Gagal mengunduh cadangan Excel', 'error');
  }
}

// 2. Unduh Laporan PDF Lengkap
function unduhLaporanPDFLengkap() {
  if (typeof exportToPDF === 'function') {
    exportToPDF();
  } else {
    showToast('Modul ekspor PDF belum siap', 'error');
  }
}

// 3. Unduh Cadangan JSON
async function unduhCadanganJSON() {
  showToast('Menyiapkan file cadangan JSON...', 'info');
  try {
    const res = await fetch('/api/system/backup');
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `backup_klinik_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Cadangan JSON berhasil diunduh', 'success');
    } else {
      const data = {
        app: 'Sistem Laporan Inventaris Klinik Aisyiyah',
        exported_at: new Date().toISOString(),
        pengaturan: clinicSettings,
        transaksi: allTransactions,
        stok_barang: allStokBarang
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `backup_klinik_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Cadangan JSON berhasil diunduh', 'success');
    }
  } catch (e) {
    console.error(e);
    showToast('Gagal mengunduh cadangan JSON', 'error');
  }
}

// 4. Modal Restore Data
let currentParsedRestoreData = null;
let currentRawRestoreFile = null;

function openModalRestore() {
  const modal = document.getElementById('modalRestoreData');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const input = document.getElementById('inputRestoreFile');
    if (input) input.value = '';
    const preview = document.getElementById('restorePreviewContainer');
    if (preview) preview.classList.add('hidden');
    const spinner = document.getElementById('restoreAnalyzingSpinner');
    if (spinner) {
      spinner.classList.add('hidden');
      spinner.classList.remove('flex');
    }
    currentParsedRestoreData = null;
    currentRawRestoreFile = null;
  }
}

function closeModalRestore() {
  const modal = document.getElementById('modalRestoreData');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Helpers Parser Client-Side
function cleanNominalValue(val) {
  if (typeof val === 'number') return Math.round(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

function parseIndoDate(val) {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmMatch) return `${dmMatch[3]}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`;
  const indoMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (indoMatch) {
    const bulanMap = {
      jan: '01', februari: '02', feb: '02', mar: '03', maret: '03', apr: '04', april: '04',
      mei: '05', may: '05', jun: '06', juni: '06', jul: '07', juli: '07', ags: '08', agu: '08',
      agustus: '08', sep: '09', september: '09', okt: '10', oktober: '10', nov: '11', november: '11',
      des: '12', desember: '12'
    };
    const bKey = indoMatch[2].toLowerCase().substring(0, 3);
    const mm = bulanMap[bKey] || '01';
    return `${indoMatch[3]}-${mm}-${indoMatch[1].padStart(2, '0')}`;
  }
  return s;
}

// Parser Excel di Browser
async function parseExcelInBrowser(file) {
  const arrayBuffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);

  const result = {
    transaksi: [],
    stok_barang: [],
    pengaturan: null
  };

  const wsTx = wb.getWorksheet('Data Transaksi Kas') || wb.getWorksheet('Transaksi');
  const wsStok = wb.getWorksheet('Stok & Barang Klinik') || wb.getWorksheet('Stok Barang Klinik') || wb.getWorksheet('Stok');

  if (wsTx) {
    let headerMap = {};
    wsTx.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '').toLowerCase().trim();
          if (val.includes('tanggal') || val.includes('tgl')) headerMap.tanggal = colNumber;
          else if (val.includes('jenis')) headerMap.jenis = colNumber;
          else if (val.includes('kategori')) headerMap.kategori = colNumber;
          else if (val.includes('uraian') || val.includes('keterangan')) headerMap.uraian = colNumber;
          else if (val.includes('satuan')) headerMap.satuan = colNumber;
          else if (val.includes('nominal') || val.includes('harga')) headerMap.nominal = colNumber;
          else if (val.includes('metode')) headerMap.metode = colNumber;
        });
        return;
      }
      const tgl = parseIndoDate(row.getCell(headerMap.tanggal || 2).value);
      const uraian = String(row.getCell(headerMap.uraian || 5).value || '').trim();
      const nominal = cleanNominalValue(row.getCell(headerMap.nominal || 7).value);
      if (uraian && nominal) {
        result.transaksi.push({
          tanggal: tgl,
          jenis: String(row.getCell(headerMap.jenis || 3).value || 'Pengeluaran').trim(),
          kategori: String(row.getCell(headerMap.kategori || 4).value || 'LAIN-LAIN').trim(),
          uraian,
          satuan: String(row.getCell(headerMap.satuan || 6).value || '-').trim(),
          nominal,
          metode: String(row.getCell(headerMap.metode || 8).value || 'Tunai').trim()
        });
      }
    });

    if (wsStok) {
      let sHeaderMap = {};
      wsStok.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            const val = String(cell.value || '').toLowerCase().trim();
            if (val.includes('kode')) sHeaderMap.kode = colNumber;
            else if (val.includes('nama')) sHeaderMap.nama = colNumber;
            else if (val.includes('kategori')) sHeaderMap.kategori = colNumber;
            else if (val.includes('jumlah') || val.includes('unit')) sHeaderMap.jumlah = colNumber;
            else if (val.includes('satuan')) sHeaderMap.satuan = colNumber;
            else if (val.includes('kondisi')) sHeaderMap.kondisi = colNumber;
            else if (val.includes('ruangan')) sHeaderMap.ruangan = colNumber;
            else if (val.includes('tanggal')) sHeaderMap.tanggal = colNumber;
            else if (val.includes('keterangan')) sHeaderMap.keterangan = colNumber;
          });
          return;
        }
        const nama = String(row.getCell(sHeaderMap.nama || 3).value || '').trim();
        if (nama) {
          result.stok_barang.push({
            kode_barang: String(row.getCell(sHeaderMap.kode || 2).value || '-').trim(),
            nama_barang: nama,
            kategori: String(row.getCell(sHeaderMap.kategori || 4).value || 'Umum').trim(),
            jumlah: parseInt(row.getCell(sHeaderMap.jumlah || 5).value, 10) || 0,
            satuan: String(row.getCell(sHeaderMap.satuan || 6).value || 'unit').trim(),
            kondisi: String(row.getCell(sHeaderMap.kondisi || 7).value || 'Baik').trim(),
            ruangan: String(row.getCell(sHeaderMap.ruangan || 8).value || '-').trim(),
            tanggal_masuk: parseIndoDate(row.getCell(sHeaderMap.tanggal || 9).value),
            keterangan: String(row.getCell(sHeaderMap.keterangan || 10).value || '-').trim()
          });
        }
      });
    }

    return result;
  }

  // Format Laporan / Sheet Pertama
  const sheet = wb.worksheets[0];
  if (!sheet) return result;

  let currentCategory = 'ALAT KANTOR';
  let totalPemasukan = 0;
  let firstDate = '';

  sheet.eachRow((row) => {
    let rowValues = [];
    row.eachCell({ includeEmpty: true }, c => rowValues.push(c.value));
    const fullText = rowValues.map(v => (v !== null && v !== undefined ? String(v) : '')).join(' ');

    const katMatch = fullText.match(/KATEGORI:\s*([A-Za-z0-9\s-]+)/i);
    if (katMatch) {
      currentCategory = katMatch[1].trim();
      return;
    }

    if (/Total Pemasukan|Dana Kas|Saldo Awal/i.test(fullText)) {
      for (let v of rowValues) {
        const nom = cleanNominalValue(v);
        if (nom > 0) totalPemasukan = nom;
      }
      return;
    }

    for (let i = 1; i <= Math.min(rowValues.length, 6); i++) {
      const c1 = row.getCell(i).value;
      const c2 = row.getCell(i + 1).value;
      const c3 = row.getCell(i + 2).value;
      const c4 = row.getCell(i + 3).value;
      const c5 = row.getCell(i + 4).value;
      const c6 = row.getCell(i + 5).value;

      if ((typeof c1 === 'number' || /^\d+$/.test(String(c1).trim())) && c2 && c3 && c6) {
        const tgl = parseIndoDate(c2);
        const nom = cleanNominalValue(c6);
        const ur = String(c3).trim();
        if (nom > 0 && ur && !/total|jumlah/i.test(ur)) {
          if (!firstDate) firstDate = tgl;
          result.transaksi.push({
            tanggal: tgl,
            jenis: 'Pengeluaran',
            kategori: currentCategory,
            uraian: ur,
            satuan: String(c4 || '-').trim(),
            metode: String(c5 || 'Tunai').trim(),
            nominal: nom
          });
          break;
        }
      }
    }
  });

  if (totalPemasukan > 0) {
    result.transaksi.push({
      tanggal: firstDate || new Date().toISOString().split('T')[0],
      jenis: 'Pemasukan',
      kategori: 'DANA MASUK',
      uraian: 'Saldo Awal Kas Klinik',
      satuan: '-',
      metode: 'Tunai',
      nominal: totalPemasukan
    });
  }

  return result;
}

// Parser PDF di Browser
async function parsePdfInBrowser(file) {
  if (typeof window.pdfjsLib === 'undefined') {
    throw new Error('Pustaka pdf.js belum tersedia di peramban');
  }
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let rawLines = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const lineMap = {};
    content.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push(item.str);
    });
    const sortedY = Object.keys(lineMap).sort((a, b) => b - a);
    sortedY.forEach(y => {
      const lineStr = lineMap[y].join(' ').trim();
      if (lineStr) rawLines.push(lineStr);
    });
  }

  const result = {
    transaksi: [],
    stok_barang: [],
    pengaturan: null
  };

  let currentCategory = 'ALAT KANTOR';
  let totalPemasukan = 0;
  let firstDate = '';
  const regexItem = /^(\d+)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}|\d{2}[/-]\d{2}[/-]\d{4})\s+(.+?)\s+([a-zA-Z0-9/]+|-)\s+(Tunai|Transfer)\s+(?:Rp\.?\s*)?([\d.,]+)$/i;

  for (let line of rawLines) {
    const katMatch = line.match(/KATEGORI:\s*([A-Za-z0-9\s-]+)/i);
    if (katMatch) {
      currentCategory = katMatch[1].trim();
      continue;
    }

    const pemMatch = line.match(/(?:Total Pemasukan|Dana Kas|Saldo Awal).*?(?:Rp\.?\s*)?([\d.,]+)/i);
    if (pemMatch) {
      const nom = cleanNominalValue(pemMatch[1]);
      if (nom > 0) totalPemasukan = nom;
      continue;
    }

    const itemMatch = line.match(regexItem);
    if (itemMatch) {
      const tgl = parseIndoDate(itemMatch[2]);
      const ur = itemMatch[3].trim();
      const sat = itemMatch[4].trim();
      const met = itemMatch[5].trim();
      const nom = cleanNominalValue(itemMatch[6]);
      if (ur && nom > 0) {
        if (!firstDate) firstDate = tgl;
        result.transaksi.push({
          tanggal: tgl,
          jenis: 'Pengeluaran',
          kategori: currentCategory,
          uraian: ur,
          satuan: sat || '-',
          metode: met || 'Tunai',
          nominal: nom
        });
      }
    }
  }

  if (totalPemasukan > 0) {
    result.transaksi.push({
      tanggal: firstDate || new Date().toISOString().split('T')[0],
      jenis: 'Pemasukan',
      kategori: 'DANA MASUK',
      uraian: 'Saldo Awal Kas Klinik',
      satuan: '-',
      metode: 'Tunai',
      nominal: totalPemasukan
    });
  }

  return result;
}

// Parser CSV di Browser
async function parseCsvInBrowser(file) {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  const result = {
    transaksi: [],
    stok_barang: [],
    pengaturan: null
  };

  let currentCategory = 'ALAT KANTOR';
  let totalPemasukan = 0;
  let firstDate = '';

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const katMatch = trimmed.match(/KATEGORI:\s*([^,;]+)/i);
    if (katMatch) {
      currentCategory = katMatch[1].trim();
      continue;
    }

    if (/Total Pemasukan|Dana Kas|Saldo Awal/i.test(trimmed)) {
      const parts = trimmed.split(/[,;\t]/);
      for (let p of parts) {
        const nom = cleanNominalValue(p);
        if (nom > 0) totalPemasukan = nom;
      }
      continue;
    }

    const parts = trimmed.split(/[,;\t]/);
    if (parts.length >= 6) {
      const col0 = parts[0].trim();
      if (/^\d+$/.test(col0)) {
        const tgl = parseIndoDate(parts[1].trim());
        const uraian = parts[2].trim();
        const satuan = parts[3].trim();
        const metode = parts[4].trim();
        const nominal = cleanNominalValue(parts[5]);

        if (uraian && nominal > 0) {
          if (!firstDate) firstDate = tgl;
          result.transaksi.push({
            tanggal: tgl,
            jenis: 'Pengeluaran',
            kategori: currentCategory,
            uraian,
            satuan: satuan || '-',
            metode: metode || 'Tunai',
            nominal
          });
        }
      }
    }
  }

  if (totalPemasukan > 0) {
    result.transaksi.push({
      tanggal: firstDate || new Date().toISOString().split('T')[0],
      jenis: 'Pemasukan',
      kategori: 'DANA MASUK',
      uraian: 'Saldo Awal Kas Klinik',
      satuan: '-',
      metode: 'Tunai',
      nominal: totalPemasukan
    });
  }

  return result;
}

// Parser JSON di Browser
async function parseJsonInBrowser(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  return {
    transaksi: data.transaksi || (Array.isArray(data) ? data : []),
    stok_barang: data.stok_barang || [],
    pengaturan: data.pengaturan || null
  };
}

// Event Handler Saat Berkas Dipilih
async function handleRestoreFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  currentRawRestoreFile = file;
  const spinner = document.getElementById('restoreAnalyzingSpinner');
  const preview = document.getElementById('restorePreviewContainer');
  
  if (spinner) {
    spinner.classList.remove('hidden');
    spinner.classList.add('flex');
  }
  if (preview) preview.classList.add('hidden');

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  
  const iconSpan = document.getElementById('restoreFileIcon');
  const badgeSpan = document.getElementById('restoreFormatBadge');
  const nameEl = document.getElementById('restoreFileName');
  const sizeEl = document.getElementById('restoreFileSize');

  if (nameEl) nameEl.innerText = file.name;
  if (sizeEl) sizeEl.innerText = `${(file.size / 1024).toFixed(1)} KB`;

  if (iconSpan && badgeSpan) {
    if (ext === 'xlsx' || ext === 'xls') {
      iconSpan.className = 'w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm shrink-0';
      iconSpan.innerHTML = '<i class="fa-solid fa-file-excel"></i>';
      badgeSpan.className = 'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0';
      badgeSpan.innerText = 'EXCEL';
    } else if (ext === 'pdf') {
      iconSpan.className = 'w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm shrink-0';
      iconSpan.innerHTML = '<i class="fa-solid fa-file-pdf"></i>';
      badgeSpan.className = 'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0';
      badgeSpan.innerText = 'PDF';
    } else if (ext === 'csv') {
      iconSpan.className = 'w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-sm shrink-0';
      iconSpan.innerHTML = '<i class="fa-solid fa-file-csv"></i>';
      badgeSpan.className = 'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 shrink-0';
      badgeSpan.innerText = 'CSV';
    } else {
      iconSpan.className = 'w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm shrink-0';
      iconSpan.innerHTML = '<i class="fa-solid fa-file-code"></i>';
      badgeSpan.className = 'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0';
      badgeSpan.innerText = 'JSON';
    }
  }

  try {
    let parsed = null;
    if (ext === 'xlsx' || ext === 'xls') {
      parsed = await parseExcelInBrowser(file);
    } else if (ext === 'pdf') {
      parsed = await parsePdfInBrowser(file);
    } else if (ext === 'csv' || ext === 'txt') {
      parsed = await parseCsvInBrowser(file);
    } else if (ext === 'json') {
      parsed = await parseJsonInBrowser(file);
    } else {
      throw new Error(`Format .${ext} tidak dikenali`);
    }

    currentParsedRestoreData = parsed;

    const tx = parsed.transaksi || [];
    const stok = parsed.stok_barang || [];
    
    let totalPengeluaran = 0;
    let totalPemasukan = 0;
    tx.forEach(t => {
      const nom = Number(t.nominal || 0);
      if (t.jenis === 'Pemasukan') totalPemasukan += nom;
      else totalPengeluaran += nom;
    });

    const txCountEl = document.getElementById('previewTxCount');
    const pengNomEl = document.getElementById('previewPengeluaranNom');
    const pemNomEl = document.getElementById('previewPemasukanNom');
    const stokCountEl = document.getElementById('previewStokCount');

    if (txCountEl) txCountEl.innerText = tx.length;
    if (pengNomEl) pengNomEl.innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    if (pemNomEl) pemNomEl.innerText = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
    if (stokCountEl) stokCountEl.innerText = stok.length;

    const tbody = document.getElementById('previewTableBody');
    const moreNotice = document.getElementById('previewMoreNotice');
    if (tbody) {
      tbody.innerHTML = '';
      const sample = tx.slice(0, 5);
      sample.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors';
        const isPem = item.jenis === 'Pemasukan';
        tr.innerHTML = `
          <td class="p-1.5 text-center text-slate-500 whitespace-nowrap">${item.tanggal || '-'}</td>
          <td class="p-1.5 text-slate-700"><span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${isPem ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${item.kategori || '-'}</span></td>
          <td class="p-1.5 font-medium text-slate-800 truncate max-w-[180px]">${item.uraian || '-'}</td>
          <td class="p-1.5 text-right font-bold ${isPem ? 'text-emerald-600' : 'text-slate-800'} whitespace-nowrap">Rp ${Number(item.nominal || 0).toLocaleString('id-ID')}</td>
        `;
        tbody.appendChild(tr);
      });
      if (moreNotice) {
        moreNotice.innerText = tx.length > 5 ? `(Menampilkan 5 dari ${tx.length} data)` : `(Total ${tx.length} data)`;
      }
    }

    if (spinner) {
      spinner.classList.add('hidden');
      spinner.classList.remove('flex');
    }
    if (preview) preview.classList.remove('hidden');
    showToast(`Berkas terbaca: ${tx.length} transaksi siap dipulihkan`, 'info');

  } catch (err) {
    console.warn('Browser parsing notice (akan ditangani backend):', err);
    if (spinner) {
      spinner.classList.add('hidden');
      spinner.classList.remove('flex');
    }
    currentParsedRestoreData = null;
    if (preview) preview.classList.remove('hidden');
    showToast('Berkas terpilih. Server akan menganalisis dan memulihkan data.', 'info');
  }
}

// 5. Submit Restore Data
async function submitRestoreData() {
  if (!currentParsedRestoreData && !currentRawRestoreFile) {
    showToast('Silakan pilih berkas cadangan (Excel/PDF/CSV/JSON) terlebih dahulu', 'error');
    return;
  }

  const mode = document.querySelector('input[name="restoreMode"]:checked')?.value || 'append';
  const btn = document.getElementById('btnSubmitRestore');
  const btnText = document.getElementById('btnSubmitRestoreText');

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Memulihkan...';

  try {
    let payload = {};

    if (currentParsedRestoreData && (currentParsedRestoreData.transaksi?.length || currentParsedRestoreData.stok_barang?.length)) {
      payload = {
        mode,
        transaksi: currentParsedRestoreData.transaksi || [],
        stok_barang: currentParsedRestoreData.stok_barang || [],
        pengaturan: currentParsedRestoreData.pengaturan || null
      };
    } else if (currentRawRestoreFile) {
      const arrayBuffer = await currentRawRestoreFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      payload = {
        mode,
        fileName: currentRawRestoreFile.name,
        fileBase64: base64
      };
    }

    showToast('Memulihkan data ke sistem...', 'info');

    const res = await fetch('/api/system/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      showToast(result.message || 'Pemulihan data berhasil!', 'success');
      closeModalRestore();
      await fetchPengaturan();
      await fetchTransaksi();
      await fetchStokBarang();
      updateSidebarBadges();
    } else {
      showToast(result.message || 'Gagal memulihkan cadangan', 'error');
    }
  } catch (err) {
    console.error('Submit restore error:', err);
    showToast('Terjadi kesalahan saat memulihkan data', 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = 'Mulai Pemulihan';
  }
}

// 6. Pasang PWA Prompt
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btnSidebarInstallPWA');
  if (btn) btn.classList.remove('hidden');
});

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast('Aplikasi Klinik berhasil dipasang di perangkat!', 'success');
      }
      deferredPrompt = null;
    });
  } else {
    showToast('Untuk memasang di ponsel/laptop: buka menu browser (titik 3) lalu pilih "Tambahkan ke Layar Utama" / "Install App"', 'info');
  }
}
