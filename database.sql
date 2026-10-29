-- ====================================================================
-- SISTEM LAPORAN INVENTARIS & PENGELUARAN/PEMASUKAN KLINIK
-- Skema Database & Data Awal (Seed Data)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `db_klinik_inventaris`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `db_klinik_inventaris`;

-- --------------------------------------------------------------------
-- 1. TABEL PENGATURAN KLINIK (Kop Laporan & Penandatangan Dokumen)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pengaturan_klinik` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `nama_klinik` VARCHAR(150) NOT NULL DEFAULT 'KLINIK AISYIYAH PANGKAJENE',
  `alamat` VARCHAR(255) NOT NULL DEFAULT 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
  `email` VARCHAR(100) NOT NULL DEFAULT 'klinikaisyiyahpangkajene@gmail.com',
  `telepon` VARCHAR(50) NOT NULL DEFAULT '0878-3117-7100',
  `kota` VARCHAR(100) NOT NULL DEFAULT 'Pangkajene',
  `jabatan_kiri` VARCHAR(150) NOT NULL DEFAULT 'Kepala Klinik',
  `nama_kiri` VARCHAR(150) NOT NULL DEFAULT 'dr. Syah Rizal Syam Pohan',
  `nip_kiri` VARCHAR(100) NOT NULL DEFAULT 'SIP: 139/SIPD/DPMPTSP/11/2022',
  `jabatan_kanan` VARCHAR(150) NOT NULL DEFAULT 'Pemegang Barang',
  `nama_kanan` VARCHAR(150) NOT NULL DEFAULT 'Hera A.md.Keb'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Konfigurasi Default Klinik (Jika belum ada)
INSERT INTO `pengaturan_klinik` (`id`, `nama_klinik`, `alamat`, `email`, `telepon`, `kota`, `jabatan_kiri`, `nama_kiri`, `nip_kiri`, `jabatan_kanan`, `nama_kanan`)
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
)
ON DUPLICATE KEY UPDATE
  `nama_klinik` = VALUES(`nama_klinik`),
  `alamat` = VALUES(`alamat`),
  `email` = VALUES(`email`),
  `telepon` = VALUES(`telepon`),
  `kota` = VALUES(`kota`),
  `jabatan_kiri` = VALUES(`jabatan_kiri`),
  `nama_kiri` = VALUES(`nama_kiri`),
  `nip_kiri` = VALUES(`nip_kiri`),
  `jabatan_kanan` = VALUES(`jabatan_kanan`),
  `nama_kanan` = VALUES(`nama_kanan`);

-- --------------------------------------------------------------------
-- 2. TABEL TRANSAKSI (Inventaris, Pengeluaran Operasional, & Pemasukan)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transaksi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `jenis` ENUM('Pengeluaran', 'Pemasukan') NOT NULL DEFAULT 'Pengeluaran',
  `kategori` VARCHAR(100) NOT NULL,
  `uraian` VARCHAR(255) NOT NULL,
  `satuan` VARCHAR(50) DEFAULT 'satuan',
  `nominal` BIGINT NOT NULL,
  `metode` ENUM('Tunai', 'Transfer') DEFAULT 'Tunai',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indeks untuk pencarian dan filter cepat
CREATE INDEX IF NOT EXISTS `idx_tanggal` ON `transaksi` (`tanggal`);
CREATE INDEX IF NOT EXISTS `idx_jenis` ON `transaksi` (`jenis`);
CREATE INDEX IF NOT EXISTS `idx_kategori` ON `transaksi` (`kategori`);

-- --------------------------------------------------------------------
-- 3. DATA AWAL (CONTOH REALISTIS BULAN OKTOBER 2026)
-- --------------------------------------------------------------------
INSERT INTO `transaksi` (`tanggal`, `jenis`, `kategori`, `uraian`, `satuan`, `nominal`, `metode`) VALUES
-- Pemasukan / Dana Kas Operasional
('2026-10-01', 'Pemasukan', 'DANA MASUK', 'Kas Masuk Saldo Awal Operasional Klinik', '-', 12000000, 'Transfer'),
('2026-10-15', 'Pemasukan', 'DANA MASUK', 'Subsidi Dana Operasional Yayasan Periode II', '-', 8500000, 'Transfer'),

-- Pengeluaran: Kategori ALAT KANTOR
('2026-10-02', 'Pengeluaran', 'ALAT KANTOR', 'Kertas HVS F4 75gr Sinar Dunia', 'rim', 58000, 'Tunai'),
('2026-10-02', 'Pengeluaran', 'ALAT KANTOR', 'Kertas HVS A4 75gr Sinar Dunia', 'rim', 54000, 'Tunai'),
('2026-10-05', 'Pengeluaran', 'ALAT KANTOR', 'Pulpen Standard AE7 Hitam (1 Kotak)', 'pak', 28000, 'Tunai'),
('2026-10-08', 'Pengeluaran', 'ALAT KANTOR', 'Tinta Printer Epson 003 Hitam Original', 'botol', 95000, 'Transfer'),
('2026-10-10', 'Pengeluaran', 'ALAT KANTOR', 'Buku Register Induk Pasien Rawat Jalan', 'buku', 65000, 'Tunai'),

-- Pengeluaran: Kategori ALAT LISTRIK
('2026-10-04', 'Pengeluaran', 'ALAT LISTRIK', 'Lampu LED Philips 14W Cool Daylight', 'unit', 75000, 'Tunai'),
('2026-10-04', 'Pengeluaran', 'ALAT LISTRIK', 'Stop Kontak Arde Uticon 5 Lubang + Kabel 3m', 'unit', 88000, 'Tunai'),
('2026-10-12', 'Pengeluaran', 'ALAT LISTRIK', 'Baterai AA Alkaline Panasonic (Tensimeter Digital)', 'pak', 42000, 'Tunai'),

-- Pengeluaran: Kategori ALAT KEBERSIHAN
('2026-10-03', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Karbol Wangi Anti Bakteri Jerigen 4 Liter', 'jerigen', 68000, 'Tunai'),
('2026-10-03', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Sabun Cuci Tangan Antiseptik 5 Liter', 'jerigen', 78000, 'Tunai'),
('2026-10-07', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Pembersih Kaca Cling Spray + Refill', 'paket', 22000, 'Tunai'),
('2026-10-11', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Tissue Hand Towel Roll Livi 200m', 'roll', 35000, 'Tunai'),
('2026-10-14', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Sapu Lantai Nilon & Pengki Plastik Maspion', 'set', 45000, 'Tunai'),

-- Pengeluaran: Kategori TAGIHAN RUTIN
('2026-10-06', 'Pengeluaran', 'TAGIHAN RUTIN', 'Pembayaran Listrik PLN Pascabayar Klinik', 'bulan', 1450000, 'Transfer'),
('2026-10-06', 'Pengeluaran', 'TAGIHAN RUTIN', 'Tagihan Air Bersih PDAM Kab. Pangkajene', 'bulan', 320000, 'Transfer'),
('2026-10-08', 'Pengeluaran', 'TAGIHAN RUTIN', 'Langganan Internet Biznet Dedicated 50 Mbps', 'bulan', 450000, 'Transfer');
