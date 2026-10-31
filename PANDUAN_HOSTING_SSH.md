# 🚀 Panduan Lengkap Hosting Aplikasi Inventaris Klinik via SSH

Panduan ini berisi langkah-langkah praktis dan teruji untuk mendeploy aplikasi **Sistem Laporan Inventaris Klinik** ke server hosting atau Virtual Private Server (VPS) menggunakan terminal SSH.

---

## 📋 Daftar Isi
1. [Prasyarat Sebelum Memulai](#1-prasyarat-sebelum-memulai)
2. [Langkah 1: Menghubungkan ke Server via SSH](#langkah-1-menghubungkan-ke-server-via-ssh)
3. [Langkah 2: Instalasi Node.js, Git, & PM2](#langkah-2-instalasi-nodejs-git--pm2)
4. [Langkah 3: Clone Repositori dari GitHub](#langkah-3-clone-repositori-dari-github)
5. [Langkah 4: Konfigurasi Database & File .env](#langkah-4-konfigurasi-database--file-env)
6. [Langkah 5: Menjalankan Aplikasi dengan PM2 (Auto-Restart)](#langkah-5-menjalankan-aplikasi-dengan-pm2-auto-restart)
7. [Langkah 6: Konfigurasi Web Server Nginx (Reverse Proxy)](#langkah-6-konfigurasi-web-server-nginx-reverse-proxy)
8. [Langkah 7: Pasang SSL Gratis HTTPS (Certbot Let's Encrypt)](#langkah-7-pasang-ssl-gratis-https-certbot-lets-encrypt)
9. [Panduan Khusus Hosting cPanel via SSH](#panduan-khusus-hosting-cpanel-via-ssh)
10. [Cara Update Kode Terbaru (Deployment Rutin)](#cara-update-kode-terbaru-deployment-rutin)

---

## 1. Prasyarat Sebelum Memulai
Pastikan Anda memiliki:
- Akses SSH ke server (IP Server, Port SSH, Username, dan Password / SSH Key).
- Server berbasis Linux (direkomendasikan **Ubuntu 20.04 / 22.04 / 24.04 LTS** atau Debian).
- Nama domain atau subdomain yang sudah diarahkan (DNS A Record) ke IP Publik server Anda (misal: `inventaris.klinikanda.com` atau `klinikanda.com`).

---

## Langkah 1: Menghubungkan ke Server via SSH

Buka **Terminal** (di Linux/macOS) atau **PowerShell / Command Prompt / Git Bash / PuTTY** (di Windows):

```bash
ssh username@IP_SERVER -p PORT_SSH
```
> *Contoh default port 22:*
```bash
ssh root@103.123.45.67
```
Masukkan password server saat diminta.

---

## Langkah 2: Instalasi Node.js, Git, & PM2

### 1. Perbarui Paket Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Pasang Node.js v20 LTS (Recommended) & Git
```bash
# Tambahkan repositori NodeSource Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Pasang Node.js, npm, dan Git
sudo apt install -y nodejs git build-essential

# Verifikasi versi terpasang
node -v   # Minimal v18 atau v20
npm -v
git --version
```

### 3. Pasang PM2 (Process Manager)
PM2 berfungsi menjaga aplikasi tetap menyala di latar belakang (*background*), merestart otomatis jika terjadi kendala, serta langsung aktif saat server di-reboot.
```bash
sudo npm install -g pm2
```

---

## Langkah 3: Clone Repositori dari GitHub

Posisikan direktori kerja aplikasi, misalnya di `/var/www/`:

```bash
# Masuk ke direktori /var/www
cd /var/www

# Clone repositori GitHub
git clone https://github.com/Arbain26/Infentaris_klinik.git inventaris-klinik

# Masuk ke folder proyek
cd inventaris-klinik

# Pasang dependensi Node.js
npm install --production
```

---

## Langkah 4: Konfigurasi Database & File `.env`

Aplikasi ini mendukung **Dual Database**: **Supabase Cloud** (Paling praktis & tanpa beban CPU di server) atau **MySQL Lokal**.

Buat file konfigurasi `.env`:
```bash
nano .env
```

### OPSI A: Menggunakan Database Supabase Cloud (Disarankan)
Isi file `.env` dengan kredensial Supabase Anda:
```env
PORT=3000
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Tekan `CTRL + O`, lalu `ENTER` untuk menyimpan, kemudian `CTRL + X` untuk keluar).*

> **PENTING:** Pastikan Anda telah menjalankan seluruh isi skrip [`supabase.sql`](supabase.sql) pada menu **SQL Editor** di dashboard Supabase Anda.

---

### OPSI B: Menggunakan Database MySQL Lokal di Server VPS
Jika Anda ingin database MySQL berjalan di server VPS yang sama:

1. **Pasang MySQL Server:**
   ```bash
   sudo apt install -y mysql-server
   sudo mysql_secure_installation
   ```

2. **Buat Database dan User MySQL:**
   ```bash
   sudo mysql -u root -p
   ```
   Ketikkan perintah SQL berikut:
   ```sql
   CREATE DATABASE db_klinik_inventaris CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'user_klinik'@'localhost' IDENTIFIED BY 'PasswordKuatAnda123!';
   GRANT ALL PRIVILEGES ON db_klinik_inventaris.* TO 'user_klinik'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Impor Skema & Data Awal:**
   ```bash
   mysql -u user_klinik -p db_klinik_inventaris < database.sql
   ```

4. **Isi File `.env` untuk MySQL:**
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=user_klinik
   DB_PASSWORD=PasswordKuatAnda123!
   DB_NAME=db_klinik_inventaris
   DB_PORT=3306
   ```

---

## Langkah 5: Menjalankan Aplikasi dengan PM2 (Auto-Restart)

Jalankan aplikasi Node.js menggunakan PM2:

```bash
# Jalankan aplikasi dengan nama "klinik-app"
pm2 start server.js --name "klinik-app"

# Simpan status proses agar otomatis berjalan saat VPS restart/booting
pm2 save

# Daftarkan PM2 ke system startup server
pm2 startup
```
*(Jika muncul perintah copy-paste dari output `pm2 startup`, jalankan perintah tersebut).*

### Perintah Berguna PM2:
- Cek status: `pm2 status`
- Cek log realtime: `pm2 logs klinik-app`
- Restart aplikasi: `pm2 restart klinik-app`
- Stop aplikasi: `pm2 stop klinik-app`

---

## Langkah 6: Konfigurasi Web Server Nginx (Reverse Proxy)

Nginx berfungsi meneruskan trafik dari port 80/443 (Domain web) ke aplikasi Node.js Anda di port 3000.

### 1. Pasang Nginx
```bash
sudo apt install -y nginx
```

### 2. Buat Konfigurasi Virtual Host Nginx
```bash
sudo nano /etc/nginx/sites-available/inventaris-klinik
```

Isi dengan konfigurasi berikut (ganti `domain-klinik-anda.com` dengan domain/subdomain Anda):

```nginx
server {
    listen 80;
    server_name domain-klinik-anda.com www.domain-klinik-anda.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Aktifkan Konfigurasi & Restart Nginx
```bash
# Buat symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/inventaris-klinik /etc/nginx/sites-enabled/

# Uji apakah konfigurasi Nginx bebas kesalahan
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

Sekarang coba buka domain Anda di browser: `http://domain-klinik-anda.com`.

---

## Langkah 7: Pasang SSL Gratis HTTPS (Certbot Let's Encrypt)

Agar koneksi web aman dan menggunakan protokol **HTTPS** (gembok hijau):

```bash
# Pasang Certbot Nginx
sudo apt install -y certbot python3-certbot-nginx

# Buat dan pasang sertifikat SSL otomatis
sudo certbot --nginx -d domain-klinik-anda.com -d www.domain-klinik-anda.com
```

Masukkan alamat email Anda dan pilih opsi redirect HTTP ke HTTPS (`Select the appropriate numbers [1/2]`: pilih opsi redirect).

Sertifikat SSL akan otomatis diperbarui setiap 90 hari oleh Certbot.

---

## Panduan Khusus Hosting cPanel via SSH

Jika Anda menggunakan hosting cPanel yang memiliki fitur SSH / Terminal:

1. **Login via SSH / Buka Fitur "Terminal" di cPanel.**
2. **Cek Ketersediaan Node.js:**
   ```bash
   node -v
   ```
   Jika Node.js belum aktif di terminal, Anda bisa mengaktifkan modul Node.js lewat menu **"Setup Node.js App"** pada cPanel:
   - Klik **"Create Application"**.
   - Pilih **Node.js Version** (rekomendasi: versi 18 atau 20).
   - Masukkan **Application root**: `inventaris` (atau folder tujuan).
   - Masukkan **Application URL**: pilih domain / subdomain Anda.
   - Masukkan **Application startup file**: `server.js`.
   - Klik **"Create"**.
3. **Clone atau Upload Proyek:**
   Salin perintah `source /home/username/nodevenv/...` yang diberikan oleh cPanel, jalankan di terminal SSH, lalu pasang dependensi:
   ```bash
   cd ~/inventaris
   npm install --production
   ```
4. **Buat file `.env`** di direktori proyek dan isi kredensial Supabase / MySQL cPanel Anda.
5. Klik **"Restart"** pada panel cPanel Setup Node.js App.

---

## Cara Update Kode Terbaru (Deployment Rutin)

Setiap kali Anda melakukan perbaikan atau perubahan kode di GitHub, Anda cukup menjalankan perintah ringkas ini via SSH:

```bash
# 1. Masuk ke folder aplikasi di server
cd /var/www/inventaris-klinik

# 2. Ambil perubahan terbaru dari GitHub
git pull origin main

# 3. Update dependensi (jika ada paket baru)
npm install --production

# 4. Restart aplikasi agar perubahan langsung aktif
pm2 restart klinik-app
```

Selesai! Web aplikasi Anda sudah berhasil dihosting dengan performa tinggi, aman (HTTPS), dan terus aktif 24/7.
