/**
 * ====================================================================
 * ROUTER: PENGATURAN KLINIK & KATEGORI
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { isSupabase, supabase, pool } = require('../config/database');
const { sanitizeString } = require('../middleware/validation');

/**
 * GET /api/pengaturan
 * Mengambil data pengaturan nama klinik, kota, dan penandatangan
 */
router.get('/pengaturan', async (req, res) => {
  const defaultSetting = {
    id: 1,
    nama_klinik: 'KLINIK AISYIYAH PANGKAJENE',
    alamat: 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
    email: 'klinikaisyiyahpangkajene@gmail.com',
    telepon: '0878-3117-7100',
    kota: 'Pangkajene',
    jabatan_kiri: 'Kepala Klinik',
    nama_kiri: 'dr. Syah Rizal Syam Pohan',
    nip_kiri: 'SIP: 139/SIPD/DPMPTSP/11/2022',
    jabatan_kanan: 'Pemegang Barang',
    nama_kanan: 'Hera A.md.Keb'
  };

  try {
    if (isSupabase) {
      const { data, error } = await supabase.from('pengaturan_klinik').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      if (!data) {
        // Auto-seed default ke Supabase jika belum ada baris
        await supabase.from('pengaturan_klinik').insert([defaultSetting]);
        return res.json({ success: true, data: defaultSetting });
      }
      return res.json({ success: true, data });
    }

    // MySQL Query
    const [rows] = await pool.query('SELECT * FROM pengaturan_klinik WHERE id = 1 LIMIT 1');
    if (rows.length === 0) {
      await pool.query('INSERT INTO pengaturan_klinik SET ?', [defaultSetting]);
      return res.json({ success: true, data: defaultSetting });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error GET /api/pengaturan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan klinik', error: error.message });
  }
});

/**
 * PUT /api/pengaturan
 * Memperbarui data pengaturan klinik dan penandatangan
 */
router.put('/pengaturan', async (req, res) => {
  try {
    const {
      nama_klinik,
      alamat,
      email,
      telepon,
      kota,
      jabatan_kiri,
      nama_kiri,
      nip_kiri,
      jabatan_kanan,
      nama_kanan
    } = req.body;

    const updatedSetting = {
      id: 1,
      nama_klinik: nama_klinik ? nama_klinik.trim() : 'KLINIK AISYIYAH PANGKAJENE',
      alamat: alamat ? alamat.trim() : 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
      email: email ? email.trim() : 'klinikaisyiyahpangkajene@gmail.com',
      telepon: telepon ? telepon.trim() : '0878-3117-7100',
      kota: kota ? kota.trim() : 'Pangkajene',
      jabatan_kiri: jabatan_kiri ? jabatan_kiri.trim() : 'Kepala Klinik',
      nama_kiri: nama_kiri ? nama_kiri.trim() : 'dr. Syah Rizal Syam Pohan',
      nip_kiri: nip_kiri ? nip_kiri.trim() : 'SIP: 139/SIPD/DPMPTSP/11/2022',
      jabatan_kanan: jabatan_kanan ? jabatan_kanan.trim() : 'Pemegang Barang',
      nama_kanan: nama_kanan ? nama_kanan.trim() : 'Hera A.md.Keb'
    };

    if (isSupabase) {
      const { data, error } = await supabase.from('pengaturan_klinik').upsert(updatedSetting).select().single();
      if (error) throw error;
      return res.json({
        success: true,
        message: 'Pengaturan klinik berhasil diperbarui.',
        data
      });
    }

    // MySQL Query
    const sql = `
      UPDATE pengaturan_klinik
      SET nama_klinik = ?, alamat = ?, email = ?, telepon = ?, kota = ?,
          jabatan_kiri = ?, nama_kiri = ?, nip_kiri = ?,
          jabatan_kanan = ?, nama_kanan = ?
      WHERE id = 1
    `;
    await pool.query(sql, [
      updatedSetting.nama_klinik,
      updatedSetting.alamat,
      updatedSetting.email,
      updatedSetting.telepon,
      updatedSetting.kota,
      updatedSetting.jabatan_kiri,
      updatedSetting.nama_kiri,
      updatedSetting.nip_kiri,
      updatedSetting.jabatan_kanan,
      updatedSetting.nama_kanan
    ]);

    res.json({
      success: true,
      message: 'Pengaturan klinik berhasil diperbarui.',
      data: updatedSetting
    });
  } catch (error) {
    console.error('Error PUT /api/pengaturan:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan klinik', error: error.message });
  }
});

/**
 * GET /api/kategori
 * Mengambil daftar kategori unik yang tersimpan
 */
router.get('/kategori', async (req, res) => {
  const defaultCategories = [
    'ALAT MEDIS',
    'ALAT KANTOR',
    'ALAT LISTRIK',
    'ALAT KEBERSIHAN',
    'MEUBEL & ASET',
    'OBAT & BHP',
    'TAGIHAN RUTIN',
    'DANA MASUK'
  ];
  try {
    if (isSupabase) {
      const { data, error } = await supabase.from('transaksi').select('kategori');
      if (error) throw error;
      const dbCategories = (data || []).map(r => r.kategori).filter(Boolean);
      const combined = Array.from(new Set([...defaultCategories, ...dbCategories]));
      return res.json({ success: true, data: combined });
    }

    const [rows] = await pool.query(`
      SELECT DISTINCT kategori 
      FROM transaksi 
      WHERE kategori IS NOT NULL AND kategori != '' 
      ORDER BY kategori ASC
    `);
    const dbCategories = rows.map(r => r.kategori);
    const combined = Array.from(new Set([...defaultCategories, ...dbCategories]));

    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Error GET /api/kategori:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori', error: error.message });
  }
});

module.exports = router;
