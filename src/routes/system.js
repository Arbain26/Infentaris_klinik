/**
 * ====================================================================
 * ROUTER: SYSTEM MONITORING & DATA BACKUP
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
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

// ====================================================================
// BACKUP DATABASE EXCEL (.XLSX) MULTI-SHEET
// ====================================================================
router.get('/backup-excel', async (req, res) => {
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
      settings = (sRes.data && sRes.data[0]) || {};
      transactions = tRes.data || [];
      stok = bRes.data || [];
    } else {
      const [[sRows], [tRows], [bRows]] = await Promise.all([
        pool.query('SELECT * FROM pengaturan_klinik LIMIT 1'),
        pool.query('SELECT * FROM transaksi ORDER BY tanggal ASC, id ASC'),
        pool.query('SELECT * FROM stok_barang ORDER BY nama_barang ASC')
      ]);
      settings = sRows[0] || {};
      transactions = tRows || [];
      stok = bRows || [];
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistem Klinik Aisyiyah';
    wb.created = new Date();

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    const headerFont = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    const zebraFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    // 1. SHEET TRANSAKSI
    const wsTx = wb.addWorksheet('Data Transaksi Kas', { views: [{ showGridLines: true }] });
    wsTx.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Jenis', key: 'jenis', width: 14 },
      { header: 'Kategori', key: 'kategori', width: 22 },
      { header: 'Uraian / Keterangan', key: 'uraian', width: 38 },
      { header: 'Satuan', key: 'satuan', width: 10 },
      { header: 'Nominal (Rp)', key: 'nominal', width: 18 },
      { header: 'Metode', key: 'metode', width: 12 },
      { header: 'Ada Bukti Nota', key: 'has_foto', width: 15 }
    ];

    wsTx.getRow(1).eachCell(cell => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    wsTx.getRow(1).height = 24;

    transactions.forEach((tx, idx) => {
      const row = wsTx.addRow({
        id: tx.id,
        tanggal: tx.tanggal,
        jenis: tx.jenis,
        kategori: tx.kategori,
        uraian: tx.uraian,
        satuan: tx.satuan || '-',
        nominal: Number(tx.nominal || 0),
        metode: tx.metode || 'Tunai',
        has_foto: tx.foto_bukti ? 'Ya (Terlampir)' : 'Tidak'
      });
      row.height = 20;
      if (idx % 2 === 1) {
        row.eachCell(c => c.fill = zebraFill);
      }
      row.eachCell(c => c.border = thinBorder);
      row.getCell('nominal').numFmt = '#,##0';
    });

    // 2. SHEET STOK BARANG
    const wsStok = wb.addWorksheet('Stok & Barang Klinik', { views: [{ showGridLines: true }] });
    wsStok.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Kode Barang', key: 'kode_barang', width: 16 },
      { header: 'Nama Barang / Alat', key: 'nama_barang', width: 35 },
      { header: 'Kategori', key: 'kategori', width: 20 },
      { header: 'Jumlah Unit', key: 'jumlah', width: 14 },
      { header: 'Satuan', key: 'satuan', width: 12 },
      { header: 'Kondisi', key: 'kondisi', width: 14 },
      { header: 'Ruangan', key: 'ruangan', width: 20 },
      { header: 'Tanggal Masuk', key: 'tanggal_masuk', width: 16 },
      { header: 'Keterangan', key: 'keterangan', width: 25 }
    ];

    wsStok.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    wsStok.getRow(1).height = 24;

    stok.forEach((item, idx) => {
      const row = wsStok.addRow({
        id: item.id,
        kode_barang: item.kode_barang || '-',
        nama_barang: item.nama_barang,
        kategori: item.kategori,
        jumlah: Number(item.jumlah || 0),
        satuan: item.satuan || 'unit',
        kondisi: item.kondisi || 'Baik',
        ruangan: item.ruangan || 'Poli Umum',
        tanggal_masuk: item.tanggal_masuk || '-',
        keterangan: item.keterangan || '-'
      });
      row.height = 20;
      if (idx % 2 === 1) {
        row.eachCell(c => c.fill = zebraFill);
      }
      row.eachCell(c => c.border = thinBorder);
    });

    // 3. SHEET PENGATURAN KLINIK
    const wsSet = wb.addWorksheet('Pengaturan & Profil', { views: [{ showGridLines: true }] });
    wsSet.columns = [
      { header: 'Parameter', key: 'key', width: 25 },
      { header: 'Nilai Konfigurasi', key: 'val', width: 55 }
    ];
    wsSet.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      cell.font = headerFont;
    });

    const setRows = [
      ['Nama Klinik', settings.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE'],
      ['Alamat', settings.alamat || '-'],
      ['Email', settings.email || '-'],
      ['Telepon', settings.telepon || '-'],
      ['Kota', settings.kota || 'Pangkajene'],
      ['Jabatan Kiri', settings.jabatan_kiri || 'Kepala Klinik'],
      ['Nama Kiri', settings.nama_kiri || '-'],
      ['NIP / SIP Kiri', settings.nip_kiri || '-'],
      ['Jabatan Kanan', settings.jabatan_kanan || 'Pemegang Barang'],
      ['Nama Kanan', settings.nama_kanan || '-'],
      ['Total Data Transaksi', transactions.length],
      ['Total Item Stok', stok.length],
      ['Tanggal Ekspor', new Date().toLocaleString('id-ID')]
    ];

    setRows.forEach(([k, v]) => {
      const r = wsSet.addRow({ key: k, val: v });
      r.border = thinBorder;
    });

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=backup_klinik_${dateStr}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating excel backup:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat cadangan Excel', error: err.message });
  }
});

const { parseAnyBackupFile } = require('../utils/fileParser');

// ====================================================================
// PULIHKAN / RESTORE DATABASE DARI FILE BACKUP (EXCEL, PDF, CSV, JSON)
// ====================================================================
router.post('/restore', async (req, res) => {
  try {
    let backup = req.body;
    const mode = (req.body && req.body.mode === 'replace') ? 'replace' : 'append';

    // Jika user mengunggah berkas dalam bentuk Base64 (Excel/PDF/CSV/JSON)
    if (backup && backup.fileBase64 && backup.fileName) {
      try {
        const fileBuffer = Buffer.from(backup.fileBase64, 'base64');
        const parsed = await parseAnyBackupFile(backup.fileName, fileBuffer);
        backup = {
          ...parsed,
          mode
        };
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          message: `Gagal membaca berkas: ${parseErr.message}`
        });
      }
    }

    if (!backup || (!backup.transaksi && !backup.stok_barang && !backup.pengaturan)) {
      return res.status(400).json({ success: false, message: 'Format data cadangan tidak valid atau berkas kosong' });
    }

    let txRestored = 0;
    let stokRestored = 0;

    // 1. JIKA MODE REPLACE (BERSIHKAN DATA LAMA TERLEBIH DAHULU)
    if (mode === 'replace') {
      if (isSupabase) {
        if (Array.isArray(backup.transaksi) && backup.transaksi.length > 0) {
          await supabase.from('transaksi').delete().neq('id', 0);
        }
        if (Array.isArray(backup.stok_barang) && backup.stok_barang.length > 0) {
          await supabase.from('stok_barang').delete().neq('id', 0);
        }
      } else {
        if (Array.isArray(backup.transaksi) && backup.transaksi.length > 0) {
          await pool.query('DELETE FROM transaksi');
          await pool.query('ALTER TABLE transaksi AUTO_INCREMENT = 1');
        }
        if (Array.isArray(backup.stok_barang) && backup.stok_barang.length > 0) {
          await pool.query('DELETE FROM stok_barang');
          await pool.query('ALTER TABLE stok_barang AUTO_INCREMENT = 1');
        }
      }
    }

    // 2. MASUKKAN DATA TRANSAKSI
    if (Array.isArray(backup.transaksi) && backup.transaksi.length > 0) {
      if (isSupabase) {
        const cleanTx = backup.transaksi.map(({ id, ...rest }) => ({
          tanggal: rest.tanggal,
          jenis: rest.jenis || 'Pengeluaran',
          kategori: rest.kategori || 'LAIN-LAIN',
          uraian: rest.uraian,
          satuan: rest.satuan || '-',
          nominal: Number(rest.nominal || 0),
          metode: rest.metode || 'Tunai',
          foto_bukti: rest.foto_bukti || null
        }));
        const { error: tErr } = await supabase.from('transaksi').insert(cleanTx);
        if (!tErr) txRestored = cleanTx.length;
        else console.warn('Supabase insert transaksi error:', tErr);
      } else {
        for (const item of backup.transaksi) {
          if (!item.uraian || !item.nominal) continue;
          await pool.query(
            'INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode, foto_bukti) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              item.tanggal || new Date().toISOString().split('T')[0],
              item.jenis || 'Pengeluaran',
              item.kategori || 'LAIN-LAIN',
              item.uraian,
              item.satuan || '-',
              Number(item.nominal || 0),
              item.metode || 'Tunai',
              item.foto_bukti || null
            ]
          );
          txRestored++;
        }
      }
    }

    // 3. MASUKKAN DATA STOK BARANG
    if (Array.isArray(backup.stok_barang) && backup.stok_barang.length > 0) {
      if (isSupabase) {
        const cleanStok = backup.stok_barang.map(({ id, ...rest }) => ({
          kode_barang: rest.kode_barang || '-',
          nama_barang: rest.nama_barang,
          kategori: rest.kategori || 'Umum',
          jumlah: Number(rest.jumlah || 0),
          satuan: rest.satuan || 'unit',
          kondisi: rest.kondisi || 'Baik',
          ruangan: rest.ruangan || '-',
          tanggal_masuk: rest.tanggal_masuk || new Date().toISOString().split('T')[0],
          keterangan: rest.keterangan || '-'
        }));
        const { error: sErr } = await supabase.from('stok_barang').insert(cleanStok);
        if (!sErr) stokRestored = cleanStok.length;
        else console.warn('Supabase insert stok error:', sErr);
      } else {
        for (const item of backup.stok_barang) {
          if (!item.nama_barang) continue;
          await pool.query(
            'INSERT INTO stok_barang (kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              item.kode_barang || '-',
              item.nama_barang,
              item.kategori || 'Umum',
              Number(item.jumlah || 0),
              item.satuan || 'unit',
              item.kondisi || 'Baik',
              item.ruangan || '-',
              item.tanggal_masuk || new Date().toISOString().split('T')[0],
              item.keterangan || '-'
            ]
          );
          stokRestored++;
        }
      }
    }

    // 4. PERBARUI PENGATURAN KLINIK JIKA ADA
    if (backup.pengaturan && typeof backup.pengaturan === 'object') {
      try {
        const p = backup.pengaturan;
        if (isSupabase) {
          await supabase.from('pengaturan_klinik').upsert({ id: 1, ...p });
        } else {
          if (p.nama_klinik) {
            await pool.query(
              'UPDATE pengaturan_klinik SET nama_klinik = COALESCE(?, nama_klinik), alamat = COALESCE(?, alamat), email = COALESCE(?, email), telepon = COALESCE(?, telepon) WHERE id = 1',
              [p.nama_klinik, p.alamat || null, p.email || null, p.telepon || null]
            );
          }
        }
      } catch (pErr) {
        console.warn('Gagal memulihkan pengaturan klinik:', pErr.message);
      }
    }

    const modeText = mode === 'replace' ? 'Data berhasil direset & dipulihkan' : 'Data berhasil ditambahkan';
    res.json({
      success: true,
      message: `${modeText}! ${txRestored} transaksi dan ${stokRestored} barang berhasil dimasukkan ke sistem.`,
      restored: { transaksi: txRestored, stok: stokRestored, mode }
    });
  } catch (err) {
    console.error('Error restoring data:', err);
    res.status(500).json({ success: false, message: 'Gagal memulihkan cadangan', error: err.message });
  }
});

module.exports = router;
