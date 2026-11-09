# 🚀 Panduan Migrasi & Deployment: NestJS + Next.js + Prisma ORM
**Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik Pratama Aisyiyah Pangkajene**

---

## 📁 Arsitektur Monorepo Proyek Baru

Proyek ini telah berhasil dimigrasikan ke arsitektur **Enterprise Monorepo**:

```
Infentaris_klinik/
├── backend/                    # Backend API: NestJS 11 + Prisma ORM (Port 3001)
│   ├── prisma/
│   │   └── schema.prisma       # Model database MySQL (PengaturanKlinik, Transaksi, StokBarang)
│   ├── src/
│   │   ├── prisma/             # PrismaService & PrismaModule (Auto-connect & BigInt serializer)
│   │   ├── pengaturan/         # Profil klinik & list kategori
│   │   ├── transaksi/          # CRUD kas (pemasukan & pengeluaran) + atomic reset saldo
│   │   ├── stok-barang/        # CRUD inventaris barang klinik
│   │   └── system/             # Health check & JSON Backup export
│   ├── .env                    # Kredensial database MySQL (Prisma DATABASE_URL)
│   └── package.json
│
├── frontend/                   # Frontend SPA/SSR: Next.js 15 + Tailwind CSS + shadcn/ui (Port 3000 / 3002)
│   ├── src/
│   │   ├── app/                # App Router Next.js (Dashboard Utama)
│   │   ├── components/         # Komponen UI: Navbar, TransaksiView, StokView, Modals
│   │   └── lib/                # API Client, Ekspor Excel (ExcelJS), Ekspor PDF (jsPDF), Tipe Data
│   └── package.json
│
├── package.json                # Root orchestration scripts
└── .gitignore
```

---

## 💻 1. Cara Menjalankan di Komputer Lokal (Development)

Buka terminal di root folder proyek:

### Menjalankan Backend (NestJS):
```bash
npm run dev:backend
```
Server NestJS akan aktif di: `http://localhost:3001/api`

### Menjalankan Frontend (Next.js):
```bash
npm run dev:frontend
```
Aplikasi web Next.js akan aktif di: `http://localhost:3000`

---

## 🌐 2. Langkah Deployment di VPS Ubuntu (`arbain@VM-1-101-ubuntu`)

### Langkah 1: Selesaikan Masalah Hak Akses MySQL di VPS
Jalankan perintah ini di VPS untuk memastikan password user `klinik_user` aktif tanpa karakter `!` yang merusak Bash:

```bash
sudo mysql -e "ALTER USER 'klinik_user'@'localhost' IDENTIFIED BY 'KlinikAisyiyah2026'; GRANT ALL PRIVILEGES ON db_klinik_inventaris.* TO 'klinik_user'@'localhost'; FLUSH PRIVILEGES;"
```

### Langkah 2: Tarik Kode Terbaru dari GitHub ke VPS
```bash
cd /var/www/inventaris-klinik
git pull origin main
```

### Langkah 3: Setup & Build Backend (NestJS)
```bash
cd /var/www/inventaris-klinik/backend
npm install --legacy-peer-deps

# Pastikan file .env backend sudah berisi password yang benar:
cat << 'EOF' > .env
PORT=3001
DATABASE_URL="mysql://klinik_user:KlinikAisyiyah2026@localhost:3306/db_klinik_inventaris"
EOF

# Sinkronkan skema Prisma dengan database MySQL VPS
npx prisma db push

# Build NestJS ke dist/
npm run build
```

### Langkah 4: Setup & Build Frontend (Next.js)
```bash
cd /var/www/inventaris-klinik/frontend
npm install --legacy-peer-deps

# Konfigurasi endpoint API NestJS
cat << 'EOF' > .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF

# Build Next.js untuk produksi
npm run build
```

### Langkah 5: Jalankan di PM2 (Backend & Frontend)
```bash
# Matikan proses express lama jika masih ada
pm2 delete klinik-inventaris

# Jalankan Backend NestJS pada port 3001
cd /var/www/inventaris-klinik/backend
pm2 start dist/src/main.js --name "klinik-api"

# Jalankan Frontend Next.js pada port 3002
cd /var/www/inventaris-klinik/frontend
PORT=3002 pm2 start npm --name "klinik-web" -- start

# Simpan konfigurasi PM2 agar otomatis jalan saat server reboot
pm2 save
```

### Langkah 6: Konfigurasi Nginx (Opsional / Reverse Proxy)
Jika Anda menggunakan Nginx untuk mengarahkan domain/IP ke aplikasi:

```nginx
server {
    listen 80;
    server_name inventaris.klinikaisyiyah.com; # Ganti dengan domain atau IP VPS Anda

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API NestJS
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 15M;
    }
}
```

---

## 🌟 Fitur Unggulan yang Telah Diimplementasikan
1. **NestJS 11 + Prisma ORM**: Arsitektur modular, clean code standar enterprise, fully typed, dan aman dari SQL Injection.
2. **Next.js 15 + Tailwind CSS + shadcn/ui**: Tampilan modern, bersih, responsif mobile, kartu ringkasan interaktif, dan filter tanggal kustom.
3. **Ekspor Excel (ExcelJS) & PDF (jsPDF)**: Logo resmi Klinik Pratama Aisyiyah tersemat rapi dengan subtotal per kategori dan kolom tanda tangan resmi pimpinan.
4. **Unggah Foto Bukti Transaksi**: Kompatibel dengan kamera smartphone dan file browser dengan preview modal instan.
5. **Sesuaikan Saldo Kas**: Perhitungan atomic transaksi untuk mengatur ulang kas secara cepat dan aman.
6. **Cadangan Data 1-Klik**: Endpoint `/api/backup` untuk mengunduh seluruh database inventaris & transaksi dalam format JSON.

