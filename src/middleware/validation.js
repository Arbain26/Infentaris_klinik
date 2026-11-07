/**
 * ====================================================================
 * VALIDATION & SANITIZATION HELPERS
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

/**
 * Sanitasi string pencarian agar aman untuk sintaks Supabase/PostgREST .or()
 * Menghilangkan karakter pembatas filter seperti koma, kurung, dan backslash
 */
function sanitizePostgrestSearch(str) {
  if (!str) return '';
  return str.replace(/[,()\\%]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Helper validasi ketat format dan keabsahan kalender tanggal (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parts = dateStr.split('-').map(Number);
  const y = parts[0], m = parts[1], d = parts[2];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y &&
    (parsed.getUTCMonth() + 1) === m &&
    parsed.getUTCDate() === d;
}

/**
 * Sanitasi string dan batas panjang karakter untuk mencegah payload memory abuse
 */
function sanitizeString(val, maxLen = 255) {
  if (val === null || val === undefined) return '';
  return String(val).trim().slice(0, maxLen);
}

module.exports = {
  sanitizePostgrestSearch,
  isValidDate,
  sanitizeString
};
