-- ====================================================================
-- SKEMA SUPABASE (POSTGRESQL) - SISTEM LAPORAN INVENTARIS KLINIK
-- Jalankan seluruh isi skrip ini di "SQL Editor" pada dashboard Supabase Anda
-- ====================================================================

-- 1. TABEL PENGATURAN KLINIK
CREATE TABLE IF NOT EXISTS public.pengaturan_klinik (
  id INT PRIMARY KEY DEFAULT 1,
  nama_klinik TEXT NOT NULL DEFAULT 'KLINIK AISYIYAH PANGKAJENE',
  alamat TEXT NOT NULL DEFAULT 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
  email TEXT NOT NULL DEFAULT 'klinikaisyiyahpangkajene@gmail.com',
  telepon TEXT NOT NULL DEFAULT '0878-3117-7100',
  kota TEXT NOT NULL DEFAULT 'Pangkajene',
  jabatan_kiri TEXT NOT NULL DEFAULT 'Kepala Klinik',
  nama_kiri TEXT NOT NULL DEFAULT 'dr. Syah Rizal Syam Pohan',
  nip_kiri TEXT NOT NULL DEFAULT 'SIP: 139/SIPD/DPMPTSP/11/2022',
  jabatan_kanan TEXT NOT NULL DEFAULT 'Pemegang Barang',
  nama_kanan TEXT NOT NULL DEFAULT 'Hera A.md.Keb'
);

-- Matikan RLS dan buat Kebijakan Akses Penuh
ALTER TABLE public.pengaturan_klinik DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Penuh Pengaturan" ON public.pengaturan_klinik;
CREATE POLICY "Akses Penuh Pengaturan" ON public.pengaturan_klinik FOR ALL TO public USING (true) WITH CHECK (true);

-- Masukkan Data Awal Pengaturan Klinik
INSERT INTO public.pengaturan_klinik (id, nama_klinik, alamat, email, telepon, kota, jabatan_kiri, nama_kiri, nip_kiri, jabatan_kanan, nama_kanan)
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
ON CONFLICT (id) DO UPDATE SET
  nama_klinik = EXCLUDED.nama_klinik,
  alamat = EXCLUDED.alamat,
  email = EXCLUDED.email,
  telepon = EXCLUDED.telepon,
  kota = EXCLUDED.kota,
  jabatan_kiri = EXCLUDED.jabatan_kiri,
  nama_kiri = EXCLUDED.nama_kiri,
  nip_kiri = EXCLUDED.nip_kiri,
  jabatan_kanan = EXCLUDED.jabatan_kanan,
  nama_kanan = EXCLUDED.nama_kanan;

-- 2. TABEL TRANSAKSI
CREATE TABLE IF NOT EXISTS public.transaksi (
  id BIGSERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'Pengeluaran',
  kategori TEXT NOT NULL,
  uraian TEXT NOT NULL,
  satuan TEXT DEFAULT 'satuan',
  nominal BIGINT NOT NULL,
  metode TEXT DEFAULT 'Tunai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matikan RLS dan buat Kebijakan Akses Penuh
ALTER TABLE public.transaksi DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Penuh Transaksi" ON public.transaksi;
CREATE POLICY "Akses Penuh Transaksi" ON public.transaksi FOR ALL TO public USING (true) WITH CHECK (true);

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON public.transaksi (tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_jenis ON public.transaksi (jenis);
CREATE INDEX IF NOT EXISTS idx_transaksi_kategori ON public.transaksi (kategori);

-- 3. DATA AWAL TRANSAKSI
INSERT INTO public.transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES
('2026-10-01', 'Pemasukan', 'DANA MASUK', 'Kas Masuk Saldo Awal Operasional Klinik', '-', 18173000, 'Transfer'),
('2026-10-02', 'Pengeluaran', 'ALAT KANTOR', 'Kertas HVS A4 Sidu 75gr (5 Rim)', 'rim', 265000, 'Tunai'),
('2026-10-03', 'Pengeluaran', 'ALAT KANTOR', 'Tinta Printer Epson 003 Hitam & Warna', 'paket', 320000, 'Tunai'),
('2026-10-04', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Cairan Disinfektan Medis Wipol 5L', 'jerigen', 175000, 'Tunai'),
('2026-10-05', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Hand Sanitizer Gel Antis 5L', 'jerigen', 240000, 'Transfer'),
('2026-10-06', 'Pengeluaran', 'ALAT LISTRIK', 'Lampu LED Philips 14W Ruang Poli (6 Pcs)', 'buah', 285000, 'Tunai'),
('2026-10-07', 'Pengeluaran', 'ALAT LISTRIK', 'Stop Kontak Broco 4 Lubang + Kabel 5M', 'set', 135000, 'Tunai'),
('2026-10-10', 'Pengeluaran', 'TAGIHAN RUTIN', 'Biaya Langganan Internet & WiFi Klinik Indihome', 'bulan', 450000, 'Transfer'),
('2026-10-11', 'Pengeluaran', 'TAGIHAN RUTIN', 'Pembelian Token Listrik PLN Pasca Bayar Klinik', 'token', 500000, 'Transfer'),
('2026-10-14', 'Pengeluaran', 'ALAT KANTOR', 'Map Rekam Medis Pasien (300 Lembar)', 'rim', 360000, 'Tunai'),
('2026-10-16', 'Pengeluaran', 'ALAT KEBERSIHAN', 'Kantong Plastik Medis Kuning Biohazard 1 Pack', 'pack', 85000, 'Tunai'),
('2026-10-18', 'Pengeluaran', 'ALAT LISTRIK', 'Baterai Timbangan Digital & Tensimeter AA (12 Pcs)', 'pack', 98000, 'Tunai'),
('2026-10-20', 'Pengeluaran', 'ALAT KANTOR', 'Buku Register Rawat Jalan & Resep Klinik (4 Buku)', 'buku', 120000, 'Tunai'),
('2026-10-22', 'Pengeluaran', 'TAGIHAN RUTIN', 'Tagihan Air PDAM Klinik Periode Oktober', 'bulan', 140000, 'Transfer');

-- ====================================================================
-- 4. TABEL STOK & BARANG TERSEDIA DI KLINIK (INVENTARIS FISIK NON-KAS)
-- Barang yang sudah ada di klinik dicatat di sini agar TIDAK mempengaruhi kas masuk/keluar
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.stok_barang (
  id BIGSERIAL PRIMARY KEY,
  kode_barang TEXT,
  nama_barang TEXT NOT NULL,
  kategori TEXT NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  satuan TEXT DEFAULT 'unit',
  kondisi TEXT DEFAULT 'Baik',
  ruangan TEXT DEFAULT 'Poli Umum',
  tanggal_masuk DATE DEFAULT CURRENT_DATE,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matikan RLS dan buat Kebijakan Akses Penuh (Supaya tidak kena error RLS)
ALTER TABLE public.stok_barang DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Penuh Stok Barang" ON public.stok_barang;
CREATE POLICY "Akses Penuh Stok Barang" ON public.stok_barang
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_stok_kategori ON public.stok_barang (kategori);
CREATE INDEX IF NOT EXISTS idx_stok_ruangan ON public.stok_barang (ruangan);
CREATE INDEX IF NOT EXISTS idx_stok_kondisi ON public.stok_barang (kondisi);

-- Data Awal Stok Barang Klinik (Aset & Peralatan yang Sudah Tersedia)
INSERT INTO public.stok_barang (kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan) VALUES
('MED-001', 'Tensimeter Digital Omron HEM-7120', 'ALAT MEDIS', 3, 'unit', 'Baik', 'Poli Umum', '2026-01-10', 'Stok Awal Klinik / Siap Pakai'),
('MED-002', 'Stetoskop Littmann Classic III', 'ALAT MEDIS', 2, 'unit', 'Baik', 'Ruang Dokter', '2026-01-10', 'Inventaris Dokter Pemeriksa'),
('MED-003', 'Termometer Gun Infrared Medis', 'ALAT MEDIS', 4, 'unit', 'Baik', 'Poli Umum & Skrining', '2026-02-01', 'Tersedia di meja skrining pasien'),
('MED-004', 'Tabung Oksigen 1m3 Lengkap Regulator', 'ALAT MEDIS', 2, 'set', 'Baik', 'Ruang Tindakan / IGD', '2026-01-15', 'Stok Darurat IGD Standby'),
('MED-005', 'Timbangan Badan & Pengukur Tinggi Dewasa', 'ALAT MEDIS', 1, 'unit', 'Baik', 'Ruang Timbang Pasien', '2026-01-10', 'Stok Ruang Pengukuran Fisik'),
('KTR-001', 'Komputer Desktop PC Kasir & Pendaftaran', 'ALAT KANTOR', 2, 'set', 'Baik', 'Front Office / Resepsionis', '2026-01-05', 'Aset Administrasi Pasien'),
('KTR-002', 'Printer Epson EcoTank L3210 All-in-One', 'ALAT KANTOR', 1, 'unit', 'Baik', 'Tata Usaha', '2026-01-05', 'Cetak Surat & Rekam Medis'),
('MEB-001', 'Tempat Tidur Periksa Pasien (Bed Medis)', 'MEUBEL & ASET', 2, 'unit', 'Baik', 'Poli Umum & IGD', '2026-01-01', 'Aset Inventaris Ruang Pemeriksaan'),
('MEB-002', 'Kursi Roda Pasien Standar Rumah Sakit', 'MEUBEL & ASET', 2, 'unit', 'Baik', 'Pintu Masuk Utama', '2026-01-12', 'Fasilitas Pasien Disabilitas / Lansia');

