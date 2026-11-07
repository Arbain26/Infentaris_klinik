/**
 * ====================================================================
 * SISTEM LAPORAN INVENTARIS & PENGELUARAN/PEMASUKAN KLINIK
 * Backend API Server (Node.js + Express.js)
 * Arsitektur Bersih & Modular (Enterprise Standard)
 * ====================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Middlewares
const {
  securityHeaders,
  rateLimiterMiddleware,
  globalErrorHandler
} = require('./src/middleware/security');

// Inisialisasi Koneksi Database
require('./src/config/database');

// REST API Routers
const transaksiRouter = require('./src/routes/transaksi');
const pengaturanRouter = require('./src/routes/pengaturan');
const stokRouter = require('./src/routes/stok');
const systemRouter = require('./src/routes/system');

const app = express();
const PORT = process.env.PORT || 3000;

// Sembunyikan identitas teknologi backend
app.disable('x-powered-by');

// Security Headers, Body Parsing, & Rate Limiting
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(rateLimiterMiddleware);

// Sajikan file statis (PWA, logo, scripts, CSS)
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Daftarkan Endpoint REST API
app.use('/api/transaksi', transaksiRouter);
app.use('/api/stok-barang', stokRouter);
app.use('/api', pengaturanRouter); // Menyajikan /api/pengaturan & /api/kategori
app.use('/api', systemRouter);     // Menyajikan /api/health & /api/backup

// Route fallback untuk Single-Page Application (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware Penangkap Error Global
app.use(globalErrorHandler);

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
