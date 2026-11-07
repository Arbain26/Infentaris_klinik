/**
 * ====================================================================
 * SISTEM LAPORAN INVENTARIS & PENGELUARAN/PEMASUKAN KLINIK
 * Backend API Server (Node.js + Express.js)
 * Mendukung Dual Database: Supabase Cloud (PostgreSQL) & MySQL
 * ====================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Sembunyikan identitas teknologi backend
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware Parsing & CORS
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// In-Memory Rate Limiter (Proteksi Anti-Spam / DoS untuk Lingkungan VPS)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Jendela waktu: 1 menit
const MAX_GLOBAL_REQ_PER_MIN = 120;     // Maksimum 120 request/menit untuk semua /api/
const MAX_MUTATION_REQ_PER_MIN = 60;    // Maksimum 60 request/menit untuk POST/PUT/DELETE

// Pembersihan berkala memori rate limit setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref(); // unref agar tidak menahan proses exit

const rateLimiterMiddleware = (req, res, next) => {
  // Hanya terapkan pembatasan pada endpoint API
  if (!req.path.startsWith('/api/')) return next();

  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
  const now = Date.now();

  let entry = rateLimitMap.get(clientIp);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { windowStart: now, count: 0, mutationCount: 0 };
    rateLimitMap.set(clientIp, entry);
  }

  entry.count++;
  const isMutation = ['POST', 'PUT', 'DELETE'].includes(req.method);
  if (isMutation) {
    entry.mutationCount++;
  }

  if (entry.count > MAX_GLOBAL_REQ_PER_MIN || entry.mutationCount > MAX_MUTATION_REQ_PER_MIN) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan dari IP Anda. Mohon tunggu 1 menit sebelum mencoba kembali.'
    });
  }

  next();
};

app.use(rateLimiterMiddleware);

// Sajikan file statis publik & root direktori
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// ====================================================================
// KONFIGURASI DATABASE (SUPABASE CLOUD vs MYSQL)
// ====================================================================

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = rawSupabaseUrl ? rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') : '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const isSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
let supabase = null;
let pool = null;

if (isSupabase) {
  console.log(`=======================================================`);
  console.log(`🌐 Menggunakan Database: SUPABASE CLOUD`);
  console.log(`🔗 Endpoint: ${SUPABASE_URL}`);
  console.log(`=======================================================`);
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.log(`=======================================================`);
  console.log(`🐬 Menggunakan Database: MYSQL (Lokal / Self-hosted)`);
  console.log(`🔗 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  console.log(`=======================================================`);

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_klinik_inventaris',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true
  });

  // Inisialisasi otomatis tabel jika menggunakan MySQL
  initMysqlDatabase();
}

async function initMysqlDatabase() {
  try {
    const connection = await pool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`pengaturan_klinik\` (
        \`id\` INT PRIMARY KEY DEFAULT 1,
        \`nama_klinik\` VARCHAR(150) NOT NULL DEFAULT 'KLINIK AISYIYAH PANGKAJENE',
        \`alamat\` VARCHAR(255) NOT NULL DEFAULT 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
        \`email\` VARCHAR(100) NOT NULL DEFAULT 'klinikaisyiyahpangkajene@gmail.com',
        \`telepon\` VARCHAR(50) NOT NULL DEFAULT '0878-3117-7100',
        \`kota\` VARCHAR(100) NOT NULL DEFAULT 'Pangkajene',
        \`jabatan_kiri\` VARCHAR(150) NOT NULL DEFAULT 'Kepala Klinik',
        \`nama_kiri\` VARCHAR(150) NOT NULL DEFAULT 'dr. Syah Rizal Syam Pohan',
        \`nip_kiri\` VARCHAR(100) NOT NULL DEFAULT 'SIP: 139/SIPD/DPMPTSP/11/2022',
        \`jabatan_kanan\` VARCHAR(150) NOT NULL DEFAULT 'Pemegang Barang',
        \`nama_kanan\` VARCHAR(150) NOT NULL DEFAULT 'Hera A.md.Keb'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      ALTER TABLE \`pengaturan_klinik\`
        ADD COLUMN IF NOT EXISTS \`alamat\` VARCHAR(255) DEFAULT 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
        ADD COLUMN IF NOT EXISTS \`email\` VARCHAR(100) DEFAULT 'klinikaisyiyahpangkajene@gmail.com',
        ADD COLUMN IF NOT EXISTS \`telepon\` VARCHAR(50) DEFAULT '0878-3117-7100';
    `);

    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM `pengaturan_klinik`');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`pengaturan_klinik\` (\`id\`, \`nama_klinik\`, \`alamat\`, \`email\`, \`telepon\`, \`kota\`, \`jabatan_kiri\`, \`nama_kiri\`, \`nip_kiri\`, \`jabatan_kanan\`, \`nama_kanan\`)
        VALUES (1, 'KLINIK AISYIYAH PANGKAJENE', 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan', 'klinikaisyiyahpangkajene@gmail.com', '0878-3117-7100', 'Pangkajene', 'Kepala Klinik', 'dr. Syah Rizal Syam Pohan', 'SIP: 139/SIPD/DPMPTSP/11/2022', 'Pemegang Barang', 'Hera A.md.Keb');
      `);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`transaksi\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tanggal\` DATE NOT NULL,
        \`jenis\` ENUM('Pengeluaran', 'Pemasukan') NOT NULL DEFAULT 'Pengeluaran',
        \`kategori\` VARCHAR(100) NOT NULL,
        \`uraian\` VARCHAR(255) NOT NULL,
        \`satuan\` VARCHAR(50) DEFAULT 'satuan',
        \`nominal\` BIGINT NOT NULL,
        \`metode\` ENUM('Tunai', 'Transfer') DEFAULT 'Tunai',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Inisialisasi Tabel Stok & Barang Tersedia di Klinik
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`stok_barang\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode_barang\` VARCHAR(50),
        \`nama_barang\` VARCHAR(255) NOT NULL,
        \`kategori\` VARCHAR(100) NOT NULL,
        \`jumlah\` INT NOT NULL DEFAULT 1,
        \`satuan\` VARCHAR(50) DEFAULT 'unit',
        \`kondisi\` ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
        \`ruangan\` VARCHAR(100) DEFAULT 'Poli Umum',
        \`tanggal_masuk\` DATE DEFAULT (CURRENT_DATE),
        \`keterangan\` VARCHAR(255),
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [stokRows] = await connection.query('SELECT COUNT(*) AS count FROM `stok_barang`');
    if (stokRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`stok_barang\` (\`kode_barang\`, \`nama_barang\`, \`kategori\`, \`jumlah\`, \`satuan\`, \`kondisi\`, \`ruangan\`, \`tanggal_masuk\`, \`keterangan\`) VALUES
        ('MED-001', 'Tensimeter Digital Omron HEM-7120', 'ALAT MEDIS', 3, 'unit', 'Baik', 'Poli Umum', '2026-01-10', 'Stok Awal Klinik / Siap Pakai'),
        ('MED-002', 'Stetoskop Littmann Classic III', 'ALAT MEDIS', 2, 'unit', 'Baik', 'Ruang Dokter', '2026-01-10', 'Inventaris Dokter Pemeriksa'),
        ('MED-003', 'Termometer Gun Infrared Medis', 'ALAT MEDIS', 4, 'unit', 'Baik', 'Poli Umum & Skrining', '2026-02-01', 'Tersedia di meja skrining pasien'),
        ('MED-004', 'Tabung Oksigen 1m3 Lengkap Regulator', 'ALAT MEDIS', 2, 'set', 'Baik', 'Ruang Tindakan / IGD', '2026-01-15', 'Stok Darurat IGD Standby'),
        ('MED-005', 'Timbangan Badan & Pengukur Tinggi Dewasa', 'ALAT MEDIS', 1, 'unit', 'Baik', 'Ruang Timbang Pasien', '2026-01-10', 'Stok Ruang Pengukuran Fisik'),
        ('KTR-001', 'Komputer Desktop PC Kasir & Pendaftaran', 'ALAT KANTOR', 2, 'set', 'Baik', 'Front Office / Resepsionis', '2026-01-05', 'Aset Administrasi Pasien'),
        ('KTR-002', 'Printer Epson EcoTank L3210 All-in-One', 'ALAT KANTOR', 1, 'unit', 'Baik', 'Tata Usaha', '2026-01-05', 'Cetak Surat & Rekam Medis'),
        ('MEB-001', 'Tempat Tidur Periksa Pasien (Bed Medis)', 'MEUBEL & ASET', 2, 'unit', 'Baik', 'Poli Umum & IGD', '2026-01-01', 'Aset Inventaris Ruang Pemeriksaan'),
        ('MEB-002', 'Kursi Roda Pasien Standar Rumah Sakit', 'MEUBEL & ASET', 2, 'unit', 'Baik', 'Pintu Masuk Utama', '2026-01-12', 'Fasilitas Pasien Disabilitas / Lansia');
      `);
    }

    connection.release();
    console.log('✅ Berhasil terhubung ke database MySQL dan tabel siap digunakan.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi database MySQL:', err.message);
    console.error('👉 Pastikan server MySQL aktif dan kredensial koneksi sesuai.');
  }
}

// ====================================================================
// REST API ENDPOINTS (Mendukung Supabase & MySQL Secara Otomatis)
// ====================================================================

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

/**
 * GET /api/transaksi
 * Mengambil semua transaksi dengan opsi filter (tahun, bulan, jenis, kategori, search, rentang tanggal)
 */
app.get('/api/transaksi', async (req, res) => {
  try {
    const { tahun, bulan, jenis, kategori, search, dari_tanggal, sampai_tanggal, page, limit } = req.query;

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));

    if (isSupabase) {
      let q = supabase.from('transaksi').select('*');

      if (jenis && jenis !== 'semua') q = q.eq('jenis', jenis);
      if (kategori && kategori !== 'semua') q = q.eq('kategori', kategori);
      if (dari_tanggal && isValidDate(dari_tanggal)) q = q.gte('tanggal', dari_tanggal);
      if (sampai_tanggal && isValidDate(sampai_tanggal)) q = q.lte('tanggal', sampai_tanggal);
      if (search && search.trim() !== '') {
        const cleanSearch = sanitizePostgrestSearch(search);
        if (cleanSearch) {
          q = q.or(`uraian.ilike.%${cleanSearch}%,kategori.ilike.%${cleanSearch}%`);
        }
      }

      q = q.order('tanggal', { ascending: true }).order('id', { ascending: true });

      const { data, error } = await q;
      if (error) throw error;

      let items = data || [];
      if (tahun && tahun !== 'semua') {
        items = items.filter(i => i.tanggal && i.tanggal.startsWith(String(tahun)));
      }
      if (bulan && bulan !== 'semua') {
        const mStr = String(bulan).padStart(2, '0');
        items = items.filter(i => {
          if (!i.tanggal) return false;
          const p = i.tanggal.split('-');
          return p.length >= 2 && p[1] === mStr;
        });
      }

      const totalCount = items.length;
      const resultData = isPaginated ? items.slice((pageNum - 1) * limitNum, pageNum * limitNum) : items;

      return res.json({
        success: true,
        count: resultData.length,
        pagination: isPaginated ? {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        } : undefined,
        data: resultData
      });
    }

    // MySQL Query
    let query = 'SELECT * FROM transaksi WHERE 1=1';
    const params = [];

    if (tahun && tahun !== 'semua') {
      query += ' AND YEAR(tanggal) = ?';
      params.push(parseInt(tahun, 10));
    }

    if (bulan && bulan !== 'semua') {
      query += ' AND MONTH(tanggal) = ?';
      params.push(parseInt(bulan, 10));
    }

    if (dari_tanggal && isValidDate(dari_tanggal)) {
      query += ' AND tanggal >= ?';
      params.push(dari_tanggal);
    }

    if (sampai_tanggal && isValidDate(sampai_tanggal)) {
      query += ' AND tanggal <= ?';
      params.push(sampai_tanggal);
    }

    if (jenis && jenis !== 'semua') {
      query += ' AND jenis = ?';
      params.push(jenis);
    }

    if (kategori && kategori !== 'semua') {
      query += ' AND kategori = ?';
      params.push(kategori);
    }

    if (search && search.trim() !== '') {
      query += ' AND (uraian LIKE ? OR kategori LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Hitung total jika dipaginasi
    let totalCount = 0;
    if (isPaginated) {
      const countQuery = query.replace('SELECT * FROM transaksi', 'SELECT COUNT(*) as total FROM transaksi');
      const [countRows] = await pool.query(countQuery, params);
      totalCount = countRows[0] ? countRows[0].total : 0;
    }

    query += ' ORDER BY tanggal ASC, id ASC';

    if (isPaginated) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limitNum, (pageNum - 1) * limitNum);
    }

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      pagination: isPaginated ? {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      } : undefined,
      data: rows
    });
  } catch (error) {
    console.error('Error GET /api/transaksi:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi', error: error.message });
  }
});

/**
 * POST /api/transaksi
 * Menambahkan data transaksi baru dengan validasi ketat
 */
app.post('/api/transaksi', async (req, res) => {
  try {
    const { tanggal, jenis, kategori, uraian, satuan, nominal, metode } = req.body;

    if (!tanggal || !kategori || !uraian || nominal === undefined || nominal === null) {
      return res.status(400).json({
        success: false,
        message: 'Field tanggal, kategori, uraian, dan nominal wajib diisi.'
      });
    }

    if (!isValidDate(tanggal)) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.'
      });
    }

    const parsedNominal = parseInt(nominal, 10);
    if (isNaN(parsedNominal) || parsedNominal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal transaksi harus berupa angka bilangan bulat positif (>= 0).'
      });
    }

    const cleanJenis = jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanUraian = sanitizeString(uraian, 500);
    const cleanSatuan = sanitizeString(satuan, 50) || '-';
    const cleanNominal = parsedNominal;
    const cleanMetode = metode === 'Transfer' ? 'Transfer' : 'Tunai';

    if (isSupabase) {
      const { data, error } = await supabase.from('transaksi').insert([{
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }]).select().single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Transaksi berhasil ditambahkan.',
        data
      });
    }

    // MySQL Insert
    const sql = `
      INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      tanggal, cleanJenis, cleanKategori, cleanUraian, cleanSatuan, cleanNominal, cleanMetode
    ]);

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil ditambahkan.',
      data: {
        id: result.insertId,
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }
    });
  } catch (error) {
    console.error('Error POST /api/transaksi:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan transaksi', error: error.message });
  }
});

/**
 * PUT /api/transaksi/:id
 * Memperbarui data transaksi yang sudah ada dengan validasi ketat
 */
app.put('/api/transaksi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, jenis, kategori, uraian, satuan, nominal, metode } = req.body;

    if (!tanggal || !kategori || !uraian || nominal === undefined || nominal === null) {
      return res.status(400).json({
        success: false,
        message: 'Field tanggal, kategori, uraian, dan nominal wajib diisi.'
      });
    }

    if (!isValidDate(tanggal)) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.'
      });
    }

    const parsedNominal = parseInt(nominal, 10);
    if (isNaN(parsedNominal) || parsedNominal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal transaksi harus berupa angka bilangan bulat positif (>= 0).'
      });
    }

    const cleanJenis = jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanUraian = sanitizeString(uraian, 500);
    const cleanSatuan = sanitizeString(satuan, 50) || '-';
    const cleanNominal = parsedNominal;
    const cleanMetode = metode === 'Transfer' ? 'Transfer' : 'Tunai';

    if (isSupabase) {
      const { data, error } = await supabase.from('transaksi').update({
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }).eq('id', id).select().single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Transaksi berhasil diperbarui.',
        data
      });
    }

    // MySQL Update
    const sql = `
      UPDATE transaksi
      SET tanggal = ?, jenis = ?, kategori = ?, uraian = ?, satuan = ?, nominal = ?, metode = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [
      tanggal, cleanJenis, cleanKategori, cleanUraian, cleanSatuan, cleanNominal, cleanMetode, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil diperbarui.',
      data: {
        id: Number(id),
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }
    });
  } catch (error) {
    console.error('Error PUT /api/transaksi/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi', error: error.message });
  }
});

/**
 * DELETE /api/transaksi/:id
 * Menghapus transaksi berdasarkan ID
 */
app.delete('/api/transaksi/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabase) {
      const { error } = await supabase.from('transaksi').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true, message: 'Data transaksi berhasil dihapus.' });
    }

    // MySQL Delete
    const [result] = await pool.query('DELETE FROM transaksi WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data transaksi berhasil dihapus.' });
  } catch (error) {
    console.error('Error DELETE /api/transaksi/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi', error: error.message });
  }
});

/**
 * POST /api/transaksi/reset-saldo
 * Mengatur ulang saldo kas klinik secara instan
 */
app.post('/api/transaksi/reset-saldo', async (req, res) => {
  try {
    const { target_saldo, tanggal, keterangan, mode } = req.body;
    const cleanTargetSaldo = Math.max(0, parseInt(target_saldo, 10) || 0);
    const cleanTanggal = (tanggal && isValidDate(tanggal)) ? tanggal : new Date().toISOString().split('T')[0];
    const cleanKeterangan = sanitizeString(keterangan, 255) || 'Saldo Awal Kas Klinik';
    const isResetClean = mode === 'bersihkan_dan_set';

    if (isSupabase) {
      if (isResetClean) {
        // 1. Ambil total pengeluaran
        const { data: pengData } = await supabase.from('transaksi').select('nominal').eq('jenis', 'Pengeluaran');
        const totalPengeluaran = (pengData || []).reduce((sum, item) => sum + (parseInt(item.nominal, 10) || 0), 0);

        // 2. Hapus semua data pemasukan lama
        await supabase.from('transaksi').delete().eq('jenis', 'Pemasukan');

        // 3. Masukkan 1 transaksi Pemasukan baru
        const nominalPemasukanBaru = cleanTargetSaldo + totalPengeluaran;
        await supabase.from('transaksi').insert([{
          tanggal: cleanTanggal,
          jenis: 'Pemasukan',
          kategori: 'DANA MASUK',
          uraian: cleanKeterangan,
          satuan: '-',
          nominal: nominalPemasukanBaru,
          metode: 'Transfer'
        }]);

        return res.json({
          success: true,
          message: `Saldo kas berhasil diatur ulang menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            nominal_pemasukan: nominalPemasukanBaru,
            total_pengeluaran: totalPengeluaran
          }
        });
      } else {
        // Mode Penyesuaian Selisih
        const { data: allData } = await supabase.from('transaksi').select('jenis, nominal');
        let totP = 0, totK = 0;
        (allData || []).forEach(x => {
          const n = parseInt(x.nominal, 10) || 0;
          if (x.jenis === 'Pemasukan') totP += n;
          else totK += n;
        });
        const currentSaldo = totP - totK;
        const selisih = cleanTargetSaldo - currentSaldo;

        if (selisih > 0) {
          await supabase.from('transaksi').insert([{
            tanggal: cleanTanggal,
            jenis: 'Pemasukan',
            kategori: 'DANA MASUK',
            uraian: cleanKeterangan || 'Penyesuaian Tambahan Saldo Kas',
            satuan: '-',
            nominal: selisih,
            metode: 'Transfer'
          }]);
        } else if (selisih < 0) {
          await supabase.from('transaksi').insert([{
            tanggal: cleanTanggal,
            jenis: 'Pengeluaran',
            kategori: 'PENYESUAIAN KAS',
            uraian: cleanKeterangan || 'Penyesuaian Koreksi Saldo Kas',
            satuan: '-',
            nominal: Math.abs(selisih),
            metode: 'Tunai'
          }]);
        }

        return res.json({
          success: true,
          message: `Saldo kas berhasil disesuaikan menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: { target_saldo: cleanTargetSaldo, selisih }
        });
      }
    }

    // MySQL Logic dengan Atomic Transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (isResetClean) {
        const [pengeluaranRows] = await conn.query(
          "SELECT COALESCE(SUM(nominal), 0) AS total_pengeluaran FROM transaksi WHERE jenis = 'Pengeluaran'"
        );
        const totalPengeluaran = parseInt(pengeluaranRows[0].total_pengeluaran, 10) || 0;

        await conn.query("DELETE FROM transaksi WHERE jenis = 'Pemasukan'");

        const nominalPemasukanBaru = cleanTargetSaldo + totalPengeluaran;
        await conn.query(
          "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pemasukan', 'DANA MASUK', ?, '-', ?, 'Transfer')",
          [cleanTanggal, cleanKeterangan, nominalPemasukanBaru]
        );

        await conn.commit();

        return res.json({
          success: true,
          message: `Saldo kas berhasil diatur ulang menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            nominal_pemasukan: nominalPemasukanBaru,
            total_pengeluaran: totalPengeluaran
          }
        });
      } else {
        const [pemasukanRows] = await conn.query("SELECT COALESCE(SUM(nominal), 0) AS total FROM transaksi WHERE jenis = 'Pemasukan'");
        const [pengeluaranRows] = await conn.query("SELECT COALESCE(SUM(nominal), 0) AS total FROM transaksi WHERE jenis = 'Pengeluaran'");

        const totalPemasukan = parseInt(pemasukanRows[0].total, 10) || 0;
        const totalPengeluaran = parseInt(pengeluaranRows[0].total, 10) || 0;
        const currentSaldo = totalPemasukan - totalPengeluaran;
        const selisih = cleanTargetSaldo - currentSaldo;

        if (selisih > 0) {
          await conn.query(
            "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pemasukan', 'DANA MASUK', ?, '-', ?, 'Transfer')",
            [cleanTanggal, cleanKeterangan || 'Penyesuaian Tambahan Saldo Kas', selisih]
          );
        } else if (selisih < 0) {
          await conn.query(
            "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pengeluaran', 'PENYESUAIAN KAS', ?, '-', ?, 'Tunai')",
            [cleanTanggal, cleanKeterangan || 'Penyesuaian Koreksi Saldo Kas', Math.abs(selisih)]
          );
        }

        await conn.commit();

        return res.json({
          success: true,
          message: `Saldo kas berhasil disesuaikan menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            selisih: selisih
          }
        });
      }
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error POST /api/transaksi/reset-saldo:', error);
    res.status(500).json({ success: false, message: 'Gagal mengatur ulang saldo', error: error.message });
  }
});

/**
 * GET /api/pengaturan
 * Mengambil data pengaturan nama klinik, kota, dan penandatangan
 */
app.get('/api/pengaturan', async (req, res) => {
  const defaultSetting = {
    id: 1,
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

  try {
    if (isSupabase) {
      const { data, error } = await supabase.from('pengaturan_klinik').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      if (!data) {
        // Auto-seed default ke Supabase jika belum ada baris
        await supabase.from('pengaturan_klinik').insert([defaultSetting]);
        return res.json({ success: true, data: defaultSetting });
      }
      return res.json({ success: true, data });
    }

    // MySQL Query
    const [rows] = await pool.query('SELECT * FROM pengaturan_klinik WHERE id = 1 LIMIT 1');
    if (rows.length === 0) {
      await pool.query('INSERT INTO pengaturan_klinik SET ?', [defaultSetting]);
      return res.json({ success: true, data: defaultSetting });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error GET /api/pengaturan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan klinik', error: error.message });
  }
});

/**
 * PUT /api/pengaturan
 * Memperbarui data pengaturan klinik dan penandatangan
 */
app.put('/api/pengaturan', async (req, res) => {
  try {
    const {
      nama_klinik,
      alamat,
      email,
      telepon,
      kota,
      jabatan_kiri,
      nama_kiri,
      nip_kiri,
      jabatan_kanan,
      nama_kanan
    } = req.body;

    const updatedSetting = {
      id: 1,
      nama_klinik: nama_klinik ? nama_klinik.trim() : 'KLINIK AISYIYAH PANGKAJENE',
      alamat: alamat ? alamat.trim() : 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
      email: email ? email.trim() : 'klinikaisyiyahpangkajene@gmail.com',
      telepon: telepon ? telepon.trim() : '0878-3117-7100',
      kota: kota ? kota.trim() : 'Pangkajene',
      jabatan_kiri: jabatan_kiri ? jabatan_kiri.trim() : 'Kepala Klinik',
      nama_kiri: nama_kiri ? nama_kiri.trim() : 'dr. Syah Rizal Syam Pohan',
      nip_kiri: nip_kiri ? nip_kiri.trim() : 'SIP: 139/SIPD/DPMPTSP/11/2022',
      jabatan_kanan: jabatan_kanan ? jabatan_kanan.trim() : 'Pemegang Barang',
      nama_kanan: nama_kanan ? nama_kanan.trim() : 'Hera A.md.Keb'
    };

    if (isSupabase) {
      const { data, error } = await supabase.from('pengaturan_klinik').upsert(updatedSetting).select().single();
      if (error) throw error;
      return res.json({
        success: true,
        message: 'Pengaturan klinik berhasil diperbarui.',
        data
      });
    }

    // MySQL Query
    const sql = `
      UPDATE pengaturan_klinik
      SET nama_klinik = ?, alamat = ?, email = ?, telepon = ?, kota = ?,
          jabatan_kiri = ?, nama_kiri = ?, nip_kiri = ?,
          jabatan_kanan = ?, nama_kanan = ?
      WHERE id = 1
    `;
    await pool.query(sql, [
      updatedSetting.nama_klinik,
      updatedSetting.alamat,
      updatedSetting.email,
      updatedSetting.telepon,
      updatedSetting.kota,
      updatedSetting.jabatan_kiri,
      updatedSetting.nama_kiri,
      updatedSetting.nip_kiri,
      updatedSetting.jabatan_kanan,
      updatedSetting.nama_kanan
    ]);

    res.json({
      success: true,
      message: 'Pengaturan klinik berhasil diperbarui.',
      data: updatedSetting
    });
  } catch (error) {
    console.error('Error PUT /api/pengaturan:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan klinik', error: error.message });
  }
});

/**
 * GET /api/kategori
 * Mengambil daftar kategori unik yang tersimpan
 */
app.get('/api/kategori', async (req, res) => {
  const defaultCategories = [
    'ALAT MEDIS',
    'ALAT KANTOR',
    'ALAT LISTRIK',
    'ALAT KEBERSIHAN',
    'MEUBEL & ASET',
    'OBAT & BHP',
    'TAGIHAN RUTIN',
    'DANA MASUK'
  ];
  try {
    if (isSupabase) {
      const { data, error } = await supabase.from('transaksi').select('kategori');
      if (error) throw error;
      const dbCategories = (data || []).map(r => r.kategori).filter(Boolean);
      const combined = Array.from(new Set([...defaultCategories, ...dbCategories]));
      return res.json({ success: true, data: combined });
    }

    const [rows] = await pool.query(`
      SELECT DISTINCT kategori 
      FROM transaksi 
      WHERE kategori IS NOT NULL AND kategori != '' 
      ORDER BY kategori ASC
    `);
    const dbCategories = rows.map(r => r.kategori);
    const combined = Array.from(new Set([...defaultCategories, ...dbCategories]));

    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Error GET /api/kategori:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori', error: error.message });
  }
});

// ====================================================================
// REST API ENDPOINTS: STOK & BARANG TERSEDIA DI KLINIK (NON-KAS)
// ====================================================================

/**
 * GET /api/stok-barang
 * Mengambil daftar stok barang klinik dengan filter pencarian, kategori, kondisi, dan ruangan
 */
app.get('/api/stok-barang', async (req, res) => {
  try {
    const { kategori, kondisi, ruangan, search, page, limit } = req.query;

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));

    if (isSupabase) {
      let q = supabase.from('stok_barang').select('*', { count: isPaginated ? 'exact' : undefined });

      if (kategori && kategori !== 'semua') q = q.eq('kategori', kategori);
      if (kondisi && kondisi !== 'semua') q = q.eq('kondisi', kondisi);
      if (ruangan && ruangan !== 'semua') q = q.eq('ruangan', ruangan);
      if (search && search.trim() !== '') {
        const cleanSearch = sanitizePostgrestSearch(search);
        if (cleanSearch) {
          q = q.or(`nama_barang.ilike.%${cleanSearch}%,kode_barang.ilike.%${cleanSearch}%,keterangan.ilike.%${cleanSearch}%`);
        }
      }

      q = q.order('id', { ascending: false });

      if (isPaginated) {
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;
        q = q.range(from, to);
      }

      const { data, count, error } = await q;
      if (error) throw error;

      return res.json({
        success: true,
        count: (data || []).length,
        pagination: isPaginated ? {
          page: pageNum,
          limit: limitNum,
          total: count || (data || []).length,
          totalPages: Math.ceil((count || (data || []).length) / limitNum)
        } : undefined,
        data: data || []
      });
    }

    // MySQL Query
    let query = 'SELECT * FROM stok_barang WHERE 1=1';
    const params = [];

    if (kategori && kategori !== 'semua') {
      query += ' AND kategori = ?';
      params.push(kategori);
    }

    if (kondisi && kondisi !== 'semua') {
      query += ' AND kondisi = ?';
      params.push(kondisi);
    }

    if (ruangan && ruangan !== 'semua') {
      query += ' AND ruangan = ?';
      params.push(ruangan);
    }

    if (search && search.trim() !== '') {
      query += ' AND (nama_barang LIKE ? OR kode_barang LIKE ? OR keterangan LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    let totalCount = 0;
    if (isPaginated) {
      const countQuery = query.replace('SELECT * FROM stok_barang', 'SELECT COUNT(*) as total FROM stok_barang');
      const [countRows] = await pool.query(countQuery, params);
      totalCount = countRows[0] ? countRows[0].total : 0;
    }

    query += ' ORDER BY id DESC';

    if (isPaginated) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limitNum, (pageNum - 1) * limitNum);
    }

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      pagination: isPaginated ? {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      } : undefined,
      data: rows
    });
  } catch (error) {
    console.error('Error GET /api/stok-barang:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data stok barang', error: error.message });
  }
});

/**
 * POST /api/stok-barang
 * Menambahkan data stok barang fisik yang sudah ada di klinik dengan validasi ketat
 */
app.post('/api/stok-barang', async (req, res) => {
  try {
    const { kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan } = req.body;

    if (!nama_barang || !kategori) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang dan kategori wajib diisi.'
      });
    }

    const cleanTanggal = (tanggal_masuk && isValidDate(tanggal_masuk))
      ? tanggal_masuk
      : new Date().toISOString().split('T')[0];
    const cleanKode = sanitizeString(kode_barang, 50).toUpperCase() || ('BRG-' + Math.floor(1000 + Math.random() * 9000));
    const cleanNama = sanitizeString(nama_barang, 255);
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanJumlah = Math.max(1, parseInt(jumlah, 10) || 1);
    const cleanSatuan = sanitizeString(satuan, 50) || 'unit';
    const cleanKondisi = ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(kondisi) ? kondisi : 'Baik';
    const cleanRuangan = sanitizeString(ruangan, 100) || 'Poli Umum';
    const cleanKeterangan = sanitizeString(keterangan, 255) || 'Stok Awal Klinik';

    if (isSupabase) {
      const { data, error } = await supabase.from('stok_barang').insert([{
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }]).select().single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Stok barang berhasil ditambahkan ke inventaris klinik.',
        data
      });
    }

    // MySQL Insert
    const sql = `
      INSERT INTO stok_barang (kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      cleanKode, cleanNama, cleanKategori, cleanJumlah, cleanSatuan, cleanKondisi, cleanRuangan, cleanTanggal, cleanKeterangan
    ]);

    res.status(201).json({
      success: true,
      message: 'Stok barang berhasil ditambahkan ke inventaris klinik.',
      data: {
        id: result.insertId,
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }
    });
  } catch (error) {
    console.error('Error POST /api/stok-barang:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan stok barang', error: error.message });
  }
});

/**
 * PUT /api/stok-barang/:id
 * Memperbarui data stok barang klinik dengan validasi ketat
 */
app.put('/api/stok-barang/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan } = req.body;

    if (!nama_barang || !kategori) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang dan kategori wajib diisi.'
      });
    }

    const cleanTanggal = (tanggal_masuk && isValidDate(tanggal_masuk))
      ? tanggal_masuk
      : new Date().toISOString().split('T')[0];
    const cleanKode = sanitizeString(kode_barang, 50).toUpperCase() || ('BRG-' + id);
    const cleanNama = sanitizeString(nama_barang, 255);
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanJumlah = Math.max(1, parseInt(jumlah, 10) || 1);
    const cleanSatuan = sanitizeString(satuan, 50) || 'unit';
    const cleanKondisi = ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(kondisi) ? kondisi : 'Baik';
    const cleanRuangan = sanitizeString(ruangan, 100) || 'Poli Umum';
    const cleanKeterangan = sanitizeString(keterangan, 255) || 'Stok Awal Klinik';

    if (isSupabase) {
      const { data, error } = await supabase.from('stok_barang').update({
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }).eq('id', id).select().single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Data stok barang berhasil diperbarui.',
        data
      });
    }

    // MySQL Update
    const sql = `
      UPDATE stok_barang
      SET kode_barang = ?, nama_barang = ?, kategori = ?, jumlah = ?, satuan = ?, kondisi = ?, ruangan = ?, tanggal_masuk = ?, keterangan = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [
      cleanKode, cleanNama, cleanKategori, cleanJumlah, cleanSatuan, cleanKondisi, cleanRuangan, cleanTanggal, cleanKeterangan, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data stok barang tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Data stok barang berhasil diperbarui.',
      data: {
        id: Number(id),
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }
    });
  } catch (error) {
    console.error('Error PUT /api/stok-barang/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui stok barang', error: error.message });
  }
});

/**
 * DELETE /api/stok-barang/:id
 * Menghapus data stok barang
 */
app.delete('/api/stok-barang/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabase) {
      const { error } = await supabase.from('stok_barang').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true, message: 'Data stok barang berhasil dihapus.' });
    }

    // MySQL Delete
    const [result] = await pool.query('DELETE FROM stok_barang WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data stok barang tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data stok barang berhasil dihapus.' });
  } catch (error) {
    console.error('Error DELETE /api/stok-barang/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus stok barang', error: error.message });
  }
});

// ====================================================================
// HEALTH CHECK ENDPOINT (VPS & PM2 MONITORING)
// ====================================================================
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (useSupabase) {
      const { error } = await supabase.from('pengaturan_klinik').select('id').limit(1);
      dbStatus = error ? `error: ${error.message}` : 'connected (supabase)';
    } else {
      await pool.query('SELECT 1');
      dbStatus = 'connected (mysql)';
    }
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: `error: ${err.message}`
    });
  }
});

// ====================================================================
// BACKUP DATABASE MANUAL (ONE-CLICK BACKUP JSON)
// ====================================================================
app.get('/api/backup', async (req, res) => {
  try {
    let settings = null;
    let transactions = [];
    let stok = [];

    if (useSupabase) {
      const [sRes, tRes, bRes] = await Promise.all([
        supabase.from('pengaturan_klinik').select('*').limit(1),
        supabase.from('transaksi').select('*').order('tanggal', { ascending: true }),
        supabase.from('stok_barang').select('*').order('nama_barang', { ascending: true })
      ]);
      settings = (sRes.data && sRes.data[0]) || null;
      transactions = tRes.data || [];
      stok = bRes.data || [];
    } else {
      const [[sRows], [tRows], [bRows]] = await Promise.all([
        pool.query('SELECT * FROM pengaturan_klinik LIMIT 1'),
        pool.query('SELECT * FROM transaksi ORDER BY tanggal ASC, id ASC'),
        pool.query('SELECT * FROM stok_barang ORDER BY nama_barang ASC')
      ]);
      settings = sRows[0] || null;
      transactions = tRows || [];
      stok = bRows || [];
    }

    const backupData = {
      app: 'Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik Aisyiyah',
      exported_at: new Date().toISOString(),
      pengaturan: settings,
      total_transaksi: transactions.length,
      total_stok_barang: stok.length,
      transaksi: transactions,
      stok_barang: stok
    };

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup_klinik_${dateStr}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    console.error('Error generating backup:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat cadangan database', error: err.message });
  }
});

// Route utama untuk menyajikan index.html secara langsung
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server',
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Jalankan Server (Hanya jika dijalankan langsung / di luar lingkungan serverless Vercel)
if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏥 SISTEM LAPORAN INVENTARIS & PENGELUARAN KLINIK`);
    console.log(`🚀 Server aktif di: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
