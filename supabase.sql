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

-- Matikan RLS agar API dapat membaca dan menulis data
ALTER TABLE public.pengaturan_klinik DISABLE ROW LEVEL SECURITY;

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

-- Matikan RLS agar API dapat membaca dan menulis data
ALTER TABLE public.transaksi DISABLE ROW LEVEL SECURITY;

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
