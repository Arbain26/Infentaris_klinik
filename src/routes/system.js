/**
 * ====================================================================
 * ROUTER: SYSTEM MONITORING & DATA BACKUP
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { isSupabase, supabase, pool } = require('../config/database');

// ====================================================================
// HEALTH CHECK ENDPOINT (VPS & PM2 MONITORING)
// ====================================================================
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (isSupabase) {
      const { error } = await supabase.from('pengaturan_klinik').select('id').limit(1);
      dbStatus = error ? `error: ${error.message}` : 'connected (supabase)';
    } else {
      await pool.query('SELECT 1');
      dbStatus = 'connected (mysql)';
    }
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: `error: ${err.message}`
    });
  }
});

// ====================================================================
// BACKUP DATABASE MANUAL (ONE-CLICK BACKUP JSON)
// ====================================================================
router.get('/backup', async (req, res) => {
  try {
    let settings = null;
    let transactions = [];
    let stok = [];

    if (isSupabase) {
      const [sRes, tRes, bRes] = await Promise.all([
        supabase.from('pengaturan_klinik').select('*').limit(1),
        supabase.from('transaksi').select('*').order('tanggal', { ascending: true }),
        supabase.from('stok_barang').select('*').order('nama_barang', { ascending: true })
      ]);
      settings = (sRes.data && sRes.data[0]) || null;
      transactions = tRes.data || [];
      stok = bRes.data || [];
    } else {
      const [[sRows], [tRows], [bRows]] = await Promise.all([
        pool.query('SELECT * FROM pengaturan_klinik LIMIT 1'),
        pool.query('SELECT * FROM transaksi ORDER BY tanggal ASC, id ASC'),
        pool.query('SELECT * FROM stok_barang ORDER BY nama_barang ASC')
      ]);
      settings = sRows[0] || null;
      transactions = tRows || [];
      stok = bRows || [];
    }

    const backupData = {
      app: 'Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik Aisyiyah',
      exported_at: new Date().toISOString(),
      pengaturan: settings,
      total_transaksi: transactions.length,
      total_stok_barang: stok.length,
      transaksi: transactions,
      stok_barang: stok
    };

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup_klinik_${dateStr}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    console.error('Error generating backup:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat cadangan database', error: err.message });
  }
});

module.exports = router;
