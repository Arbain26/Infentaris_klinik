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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file statis (termasuk index.html) di root direktori
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
 * GET /api/transaksi
 * Mengambil semua transaksi dengan opsi filter (tahun, bulan, jenis, kategori, search)
 */
app.get('/api/transaksi', async (req, res) => {
  try {
    const { tahun, bulan, jenis, kategori, search } = req.query;

    if (isSupabase) {
      let q = supabase.from('transaksi').select('*');

      if (jenis && jenis !== 'semua') q = q.eq('jenis', jenis);
      if (kategori && kategori !== 'semua') q = q.eq('kategori', kategori);
      if (search && search.trim() !== '') {
        q = q.or(`uraian.ilike.%${search.trim()}%,kategori.ilike.%${search.trim()}%`);
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

      return res.json({ success: true, count: items.length, data: items });
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

    query += ' ORDER BY tanggal ASC, id ASC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
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
    const cleanTanggal = tanggal || new Date().toISOString().split('T')[0];
    const cleanKeterangan = (keterangan && keterangan.trim()) ? keterangan.trim() : 'Saldo Awal Kas Klinik';
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

    // MySQL Logic
    if (isResetClean) {
      const [pengeluaranRows] = await pool.query(
        "SELECT COALESCE(SUM(nominal), 0) AS total_pengeluaran FROM transaksi WHERE jenis = 'Pengeluaran'"
      );
      const totalPengeluaran = parseInt(pengeluaranRows[0].total_pengeluaran, 10) || 0;

      await pool.query("DELETE FROM transaksi WHERE jenis = 'Pemasukan'");

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
  const defaultCategories = ['ALAT KANTOR', 'ALAT LISTRIK', 'ALAT KEBERSIHAN', 'TAGIHAN RUTIN', 'DANA MASUK'];
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
