/**
 * ====================================================================
 * DATABASE CONFIGURATION (SUPABASE CLOUD & MYSQL)
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');

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

    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM \`pengaturan_klinik\`');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`pengaturan_klinik\` (\`id\`, \`nama_klinik\`, \`alamat\`, \`email\`, \`telepon\`, \`kota\`, \`jabatan_kiri\`, \`nama_kiri\`, \`nip_kiri\`, \`jabatan_kanan\`, \`nama_kanan\`)
        VALUES (
          1,
          'KLINIK AISYIYAH PANGKAJENE',
          'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
          'klinikaisyiyahpangkajene@gmail.com',
          '0878-3117-7100',
          'Pangkajene',
          'Kepala Klinik',
          'dr. Syah Rizal Syam Pohan',
          'SIP: 139/SIPD/DPMPTSP/11/2022',
          'Pemegang Barang',
          'Hera A.md.Keb'
        );
      `);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`transaksi\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tanggal\` DATE NOT NULL,
        \`jenis\` ENUM('Pengeluaran', 'Pemasukan') NOT NULL DEFAULT 'Pengeluaran',
        \`kategori\` VARCHAR(100) NOT NULL,
        \`uraian\` TEXT NOT NULL,
        \`volume\` INT NOT NULL DEFAULT 1,
        \`satuan\` VARCHAR(50) NOT NULL DEFAULT 'Unit',
        \`harga_satuan\` BIGINT NOT NULL DEFAULT 0,
        \`nominal\` BIGINT NOT NULL,
        \`metode\` VARCHAR(50) NOT NULL DEFAULT 'Tunai',
        \`bukti_nota\` VARCHAR(255) DEFAULT NULL,
        \`foto_bukti\` LONGTEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      ALTER TABLE \`transaksi\`
        ADD COLUMN IF NOT EXISTS \`volume\` INT NOT NULL DEFAULT 1 AFTER \`uraian\`,
        ADD COLUMN IF NOT EXISTS \`satuan\` VARCHAR(50) NOT NULL DEFAULT 'Unit' AFTER \`volume\`,
        ADD COLUMN IF NOT EXISTS \`harga_satuan\` BIGINT NOT NULL DEFAULT 0 AFTER \`satuan\`,
        ADD COLUMN IF NOT EXISTS \`foto_bukti\` LONGTEXT DEFAULT NULL;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`stok_barang\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode_barang\` VARCHAR(50) DEFAULT NULL,
        \`nama_barang\` VARCHAR(200) NOT NULL,
        \`kategori\` VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
        \`jumlah\` INT NOT NULL DEFAULT 0,
        \`satuan\` VARCHAR(50) NOT NULL DEFAULT 'Unit',
        \`kondisi\` ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') NOT NULL DEFAULT 'Baik',
        \`ruangan\` VARCHAR(100) NOT NULL DEFAULT 'Umum',
        \`sumber_dana\` VARCHAR(100) DEFAULT 'Klinik',
        \`tanggal_masuk\` DATE DEFAULT NULL,
        \`keterangan\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    connection.release();
    console.log('✅ Berhasil terhubung ke database MySQL dan tabel siap digunakan.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi database MySQL:', err.message);
    console.error('👉 Pastikan server MySQL aktif dan kredensial koneksi sesuai.');
  }
}

module.exports = {
  isSupabase,
  supabase,
  pool
};
