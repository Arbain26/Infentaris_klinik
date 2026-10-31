# Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik

Aplikasi web modern, cepat, dan siap online untuk pencatatan inventaris barang, pengeluaran operasional, serta kas masuk klinik. Dibangun dengan arsitektur bersih dan ringkas menggunakan **Full JavaScript (Node.js + Express.js + MySQL)**.

---

## 🌟 Fitur Utama
1. **Manajemen Stok & Barang Tersedia di Klinik (Non-Kas)**:
   - Pencatatan aset, peralatan medis, obat/BHP, dan stok barang yang **sudah ada di klinik**.
   - Terisolasi penuh dari pencatatan arus kas (tidak dihitung sebagai pemasukan uang kas maupun pengeluaran kas operasional berjalan).
   - Dilengkapi 4 kartu ringkasan fisik: Total Ragam Barang, Total Unit Fisik, Kondisi Baik, dan Perlu Perbaikan.
   - Filter cepat berdasarkan kategori, lokasi ruangan, kondisi, serta pencarian instan nama/kode barang.
2. **Pencatatan Inventaris & Pengeluaran**:
   - Pengelompokan (*grouping*) otomatis berdasarkan kategori barang.
   - Penghitungan sub-total per kategori dan grand total pengeluaran.
3. **Pengelolaan Kas Masuk & Saldo Real-Time**:
   - Pencatatan dana masuk / saldo kas operasional.
   - Perhitungan otomatis sisa saldo kas: `Pemasukan - Pengeluaran`.
4. **Kop Surat & Logo Resmi Terintegrasi**:
   - Memuat logo dan identitas resmi Klinik Pratama Aisyiyah Pangkajene.
   - Blok tanda tangan resmi Kepala Klinik (*dengan SIP*) dan Pemegang Barang.
5. **Ekspor Laporan Resmi Canggih**:
   - **Excel (.xlsx)**: Menggunakan ExcelJS dengan logo gambar resmi tersemat, styling border, merge cell, format Rupiah asli, dan tanda tangan.
   - **PDF (.pdf)**: Menggunakan jsPDF + AutoTable siap cetak dengan logo, garis ganda resmi, dan tabel terformat rapi.
6. **Pengaturan Dinamis**:
   - Nama klinik, alamat, email, telepon, dan nama/jabatan penandatangan dapat disesuaikan langsung lewat modal pengaturan.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- **Node.js** (versi 16 atau lebih baru)
- **MySQL / MariaDB** (misal via XAMPP)

### 2. Konfigurasi Database
1. Buka phpMyAdmin atau terminal MySQL.
2. Impor file `database.sql` ke MySQL:
   ```bash
   mysql -u root -p < database.sql
   ```
   *(Database `db_klinik_inventaris` beserta tabel dan data awal akan otomatis terbuat).*

### 3. Instalasi Dependensi
Jalankan perintah berikut di folder proyek:
```bash
npm install
```

### 4. Menjalankan Server
```bash
npm start
# atau
node server.js
```
Buka browser dan akses: `http://localhost:3000`

---

## 🌐 Panduan Hosting di Server VPS / SSH
Ingin mendeploy aplikasi ini ke VPS Linux / akun hosting SSH Anda dengan domain sendiri dan SSL HTTPS gratis?
👉 Silakan baca panduan langkah-demi-langkah di: **[PANDUAN_HOSTING_SSH.md](PANDUAN_HOSTING_SSH.md)**

---

## 📁 Struktur Berkas
- `PANDUAN_HOSTING_SSH.md`: Panduan lengkap hosting di VPS/Server via SSH (Node.js, PM2, Nginx, Certbot SSL).
- `database.sql`: Skema tabel dan seed data awal MySQL.
- `supabase.sql`: Skema tabel dan seed data PostgreSQL (Supabase Cloud).
- `package.json`: Konfigurasi dependensi Express, mysql2, cors, dan dotenv.
- `server.js`: Backend Node.js + Express + REST API CRUD (Supabase & MySQL).
- `index.html`: Frontend Single-File responsif dengan Tailwind CSS, sistem tab, modal CRUD, dan ekspor laporan.
