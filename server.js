/**
 * ====================================================================
 * SISTEM LAPORAN INVENTARIS & PENGELUARAN/PEMASUKAN KLINIK
 * Backend API Server (Node.js + Express.js + MySQL Pool)
 * ====================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file statis (termasuk index.html) di root direktori
app.use(express.static(__dirname));

// Konfigurasi MySQL Pool
const pool = mysql.createPool({
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
  dateStrings: true // Kembalikan tanggal sebagai string 'YYYY-MM-DD'
});

// Inisialisasi otomatis tabel jika belum ada (Auto-migration pada hosting baru)
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 1. Tabel Pengaturan Klinik
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

    // Tambah kolom jika tabel sudah ada dari versi sebelumnya
    await connection.query(`
      ALTER TABLE \`pengaturan_klinik\`
        ADD COLUMN IF NOT EXISTS \`alamat\` VARCHAR(255) DEFAULT 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
        ADD COLUMN IF NOT EXISTS \`email\` VARCHAR(100) DEFAULT 'klinikaisyiyahpangkajene@gmail.com',
        ADD COLUMN IF NOT EXISTS \`telepon\` VARCHAR(50) DEFAULT '0878-3117-7100';
    `);

    // Inisialisasi data pengaturan jika kosong
    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM `pengaturan_klinik`');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`pengaturan_klinik\` (\`id\`, \`nama_klinik\`, \`alamat\`, \`email\`, \`telepon\`, \`kota\`, \`jabatan_kiri\`, \`nama_kiri\`, \`nip_kiri\`, \`jabatan_kanan\`, \`nama_kanan\`)
        VALUES (1, 'KLINIK AISYIYAH PANGKAJENE', 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan', 'klinikaisyiyahpangkajene@gmail.com', '0878-3117-7100', 'Pangkajene', 'Kepala Klinik', 'dr. Syah Rizal Syam Pohan', 'SIP: 139/SIPD/DPMPTSP/11/2022', 'Pemegang Barang', 'Hera A.md.Keb');
      `);
    }

    // 2. Tabel Transaksi
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

    connection.release();
    console.log('✅ Berhasil terhubung ke database MySQL dan tabel siap digunakan.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi database MySQL:', err.message);
    console.error('👉 Pastikan server MySQL aktif dan kredensial koneksi sesuai.');
  }
}

initDatabase();

// ====================================================================
// REST API ENDPOINTS
// ====================================================================

/**
 * GET /api/transaksi
 * Mengambil semua transaksi dengan opsi filter (tahun, bulan, jenis, kategori, search)
 */
app.get('/api/transaksi', async (req, res) => {
  try {
    const { tahun, bulan, jenis, kategori, search } = req.query;

    let query = `
      SELECT 
        id,
        DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
        jenis,
        kategori,
        uraian,
        satuan,
        nominal,
        metode,
        created_at
      FROM transaksi
      WHERE 1=1
    `;
    const params = [];

    if (tahun && tahun !== 'semua') {
      query += ' AND YEAR(tanggal) = ?';
      params.push(Number(tahun));
    }

    if (bulan && bulan !== 'semua') {
      query += ' AND MONTH(tanggal) = ?';
      params.push(Number(bulan));
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

    // Urutkan berdasarkan tanggal ASC, lalu id ASC (standar laporan inventaris)
    query += ' ORDER BY tanggal ASC, id ASC';

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error GET /api/transaksi:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi', error: error.message });
  }
});

/**
 * POST /api/transaksi
 * Menambahkan data transaksi baru
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

    const cleanJenis = jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const cleanKategori = kategori.trim().toUpperCase();
    const cleanUraian = uraian.trim();
    const cleanSatuan = (satuan && satuan.trim()) ? satuan.trim() : '-';
    const cleanNominal = Math.abs(parseInt(nominal, 10)) || 0;
    const cleanMetode = metode === 'Transfer' ? 'Transfer' : 'Tunai';

    const sql = `
      INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      tanggal,
      cleanJenis,
      cleanKategori,
      cleanUraian,
      cleanSatuan,
      cleanNominal,
      cleanMetode
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
 * Memperbarui data transaksi yang sudah ada
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

    const cleanJenis = jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const cleanKategori = kategori.trim().toUpperCase();
    const cleanUraian = uraian.trim();
    const cleanSatuan = (satuan && satuan.trim()) ? satuan.trim() : '-';
    const cleanNominal = Math.abs(parseInt(nominal, 10)) || 0;
    const cleanMetode = metode === 'Transfer' ? 'Transfer' : 'Tunai';

    const sql = `
      UPDATE transaksi
      SET tanggal = ?, jenis = ?, kategori = ?, uraian = ?, satuan = ?, nominal = ?, metode = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [
      tanggal,
      cleanJenis,
      cleanKategori,
      cleanUraian,
      cleanSatuan,
      cleanNominal,
      cleanMetode,
      id
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
    const cleanTanggal = tanggal || new Date().toISOString().split('T')[0];
    const cleanKeterangan = (keterangan && keterangan.trim()) ? keterangan.trim() : 'Saldo Awal Kas Klinik';
    const isResetClean = mode === 'bersihkan_dan_set';

    if (isResetClean) {
      // 1. Hitung total pengeluaran yang ada
      const [pengeluaranRows] = await pool.query(
        "SELECT COALESCE(SUM(nominal), 0) AS total_pengeluaran FROM transaksi WHERE jenis = 'Pengeluaran'"
      );
      const totalPengeluaran = parseInt(pengeluaranRows[0].total_pengeluaran, 10) || 0;

      // 2. Hapus seluruh data pemasukan lama
      await pool.query("DELETE FROM transaksi WHERE jenis = 'Pemasukan'");

      // 3. Masukkan 1 transaksi Pemasukan baru agar Sisa Saldo = cleanTargetSaldo
      // Rumus: Sisa Saldo = Total Pemasukan - Total Pengeluaran
      // Maka: Total Pemasukan Baru = cleanTargetSaldo + totalPengeluaran
      const nominalPemasukanBaru = cleanTargetSaldo + totalPengeluaran;

      await pool.query(
        "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pemasukan', 'DANA MASUK', ?, '-', ?, 'Transfer')",
        [cleanTanggal, cleanKeterangan, nominalPemasukanBaru]
      );

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
      // Mode Penyesuaian Saldo Otomatis (Adjust)
      const [pemasukanRows] = await pool.query("SELECT COALESCE(SUM(nominal), 0) AS total FROM transaksi WHERE jenis = 'Pemasukan'");
      const [pengeluaranRows] = await pool.query("SELECT COALESCE(SUM(nominal), 0) AS total FROM transaksi WHERE jenis = 'Pengeluaran'");

      const totalPemasukan = parseInt(pemasukanRows[0].total, 10) || 0;
      const totalPengeluaran = parseInt(pengeluaranRows[0].total, 10) || 0;
      const currentSaldo = totalPemasukan - totalPengeluaran;
      const selisih = cleanTargetSaldo - currentSaldo;

      if (selisih > 0) {
        await pool.query(
          "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pemasukan', 'DANA MASUK', ?, '-', ?, 'Transfer')",
          [cleanTanggal, cleanKeterangan || 'Penyesuaian Tambahan Saldo Kas', selisih]
        );
      } else if (selisih < 0) {
        await pool.query(
          "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pengeluaran', 'PENYESUAIAN KAS', ?, '-', ?, 'Tunai')",
          [cleanTanggal, cleanKeterangan || 'Penyesuaian Koreksi Saldo Kas', Math.abs(selisih)]
        );
      }

      return res.json({
        success: true,
        message: `Saldo kas berhasil disesuaikan menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
        data: {
          target_saldo: cleanTargetSaldo,
          selisih: selisih
        }
      });
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
  try {
    const [rows] = await pool.query('SELECT * FROM pengaturan_klinik WHERE id = 1 LIMIT 1');
    if (rows.length === 0) {
      // Buat default jika belum ada
      const defaultSetting = {
        id: 1,
        nama_klinik: 'Klinik Aisyiyah Pangkajene',
        kota: 'Pangkajene',
        jabatan_kiri: 'Mengetahui, Pimpinan Klinik',
        nama_kiri: 'dr. H. Rahmatullah, Sp.A',
        nip_kiri: 'NIP. 19780512 200501 1 004',
        jabatan_kanan: 'Pemegang Barang / Admin',
        nama_kanan: 'Nurhalimah, A.Md.Keb'
      };
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

    const sql = `
      INSERT INTO pengaturan_klinik (id, nama_klinik, alamat, email, telepon, kota, jabatan_kiri, nama_kiri, nip_kiri, jabatan_kanan, nama_kanan)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama_klinik = VALUES(nama_klinik),
        alamat = VALUES(alamat),
        email = VALUES(email),
        telepon = VALUES(telepon),
        kota = VALUES(kota),
        jabatan_kiri = VALUES(jabatan_kiri),
        nama_kiri = VALUES(nama_kiri),
        nip_kiri = VALUES(nip_kiri),
        jabatan_kanan = VALUES(jabatan_kanan),
        nama_kanan = VALUES(nama_kanan)
    `;

    await pool.query(sql, [
      nama_klinik || 'KLINIK AISYIYAH PANGKAJENE',
      alamat || 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
      email || 'klinikaisyiyahpangkajene@gmail.com',
      telepon || '0878-3117-7100',
      kota || 'Pangkajene',
      jabatan_kiri || 'Kepala Klinik',
      nama_kiri || 'dr. Syah Rizal Syam Pohan',
      nip_kiri || 'SIP: 139/SIPD/DPMPTSP/11/2022',
      jabatan_kanan || 'Pemegang Barang',
      nama_kanan || 'Hera A.md.Keb'
    ]);

    res.json({
      success: true,
      message: 'Pengaturan klinik berhasil diperbarui.',
      data: req.body
    });
  } catch (error) {
    console.error('Error PUT /api/pengaturan:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan klinik', error: error.message });
  }
});

/**
 * GET /api/kategori
 * Mengambil daftar kategori unik yang tersimpan
 */
app.get('/api/kategori', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT kategori 
      FROM transaksi 
      WHERE kategori IS NOT NULL AND kategori != '' 
      ORDER BY kategori ASC
    `);
    const defaultCategories = ['ALAT KANTOR', 'ALAT LISTRIK', 'ALAT KEBERSIHAN', 'TAGIHAN RUTIN', 'DANA MASUK'];
    const dbCategories = rows.map(r => r.kategori);
    const combined = Array.from(new Set([...defaultCategories, ...dbCategories]));

    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Error GET /api/kategori:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori', error: error.message });
  }
});

// Route utama untuk menyajikan index.html secara langsung
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
