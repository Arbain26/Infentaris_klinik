/**
 * ====================================================================
 * CONFIG & GLOBAL HELPERS
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

// Path Logo Resmi Klinik
const LOGO_AISYIYAH_SRC = '/public/images/logo.png';

// State Global Aplikasi
let allTransactions = [];
let filteredTransactions = [];
let allStokBarang = [];
let filteredStokBarang = [];
let currentTab = 'stok'; // Default tab: 'stok', 'pengeluaran', atau 'pemasukan'

let clinicSettings = {
  nama_klinik: 'KLINIK AISYIYAH PANGKAJENE',
  alamat: 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
  email: 'klinikaisyiyahpangkajene@gmail.com',
  telepon: '0878-3117-7100',
  kota: 'Pangkajene',
  jabatan_kiri: 'Kepala Klinik',
  nama_kiri: 'dr. Syah Rizal Syam Pohan',
  nip_kiri: 'SIP: 139/SIPD/DPMPTSP/11/2022',
  jabatan_kanan: 'Pemegang Barang',
  nama_kanan: 'Hera A.md.Keb'
};

/**
 * Format angka ke format mata uang Rupiah (IDR)
 */
function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num || 0);
}

/**
 * Format tanggal YYYY-MM-DD ke teks formal Indonesia (contoh: 29 Oktober 2026)
 */
function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = parseInt(parts[2], 10);
  const mIndex = parseInt(parts[1], 10) - 1;
  const y = parts[0];
  const bulanNama = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d} ${bulanNama[mIndex]} ${y}`;
}

/**
 * Sanitasi HTML untuk mencegah XSS pada rendering data dinamis
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Menampilkan notifikasi Toast mengambang di pojok layar
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const isSuccess = type === 'success';

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-y-3 opacity-0 ${
    isSuccess
      ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/20'
      : 'bg-rose-900 text-white border-rose-700 shadow-rose-900/20'
  }`;

  toast.innerHTML = `
    <i class="fa-solid ${isSuccess ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'} text-base"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-3');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

