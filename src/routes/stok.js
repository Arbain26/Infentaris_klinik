/**
 * ====================================================================
 * ROUTER: INVENTARIS STOK BARANG KLINIK
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { isSupabase, supabase, pool } = require('../config/database');
const { isValidDate, sanitizeString, sanitizePostgrestSearch } = require('../middleware/validation');

/**
 * GET /api/stok-barang
 * Mengambil daftar stok barang klinik dengan filter pencarian, kategori, kondisi, dan ruangan
 */
router.get('/', async (req, res) => {
  try {
    const { kategori, kondisi, ruangan, search, page, limit } = req.query;

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));

    if (isSupabase) {
      let q = supabase.from('stok_barang').select('*', { count: isPaginated ? 'exact' : undefined });

      if (kategori && kategori !== 'semua') q = q.eq('kategori', kategori);
      if (kondisi && kondisi !== 'semua') q = q.eq('kondisi', kondisi);
      if (ruangan && ruangan !== 'semua') q = q.eq('ruangan', ruangan);
      if (search && search.trim() !== '') {
        const cleanSearch = sanitizePostgrestSearch(search);
        if (cleanSearch) {
          q = q.or(`nama_barang.ilike.%${cleanSearch}%,kode_barang.ilike.%${cleanSearch}%,keterangan.ilike.%${cleanSearch}%`);
        }
      }

      q = q.order('id', { ascending: false });

      if (isPaginated) {
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;
        q = q.range(from, to);
      }

      const { data, count, error } = await q;
      if (error) throw error;

      return res.json({
        success: true,
        count: (data || []).length,
        pagination: isPaginated ? {
          page: pageNum,
          limit: limitNum,
          total: count || (data || []).length,
          totalPages: Math.ceil((count || (data || []).length) / limitNum)
        } : undefined,
        data: data || []
      });
    }

    // MySQL Query
    let query = 'SELECT * FROM stok_barang WHERE 1=1';
    const params = [];

    if (kategori && kategori !== 'semua') {
      query += ' AND kategori = ?';
      params.push(kategori);
    }

    if (kondisi && kondisi !== 'semua') {
      query += ' AND kondisi = ?';
      params.push(kondisi);
    }

    if (ruangan && ruangan !== 'semua') {
      query += ' AND ruangan = ?';
      params.push(ruangan);
    }

    if (search && search.trim() !== '') {
      query += ' AND (nama_barang LIKE ? OR kode_barang LIKE ? OR keterangan LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    let totalCount = 0;
    if (isPaginated) {
      const countQuery = query.replace('SELECT * FROM stok_barang', 'SELECT COUNT(*) as total FROM stok_barang');
      const [countRows] = await pool.query(countQuery, params);
      totalCount = countRows[0] ? countRows[0].total : 0;
    }

    query += ' ORDER BY id DESC';

    if (isPaginated) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limitNum, (pageNum - 1) * limitNum);
    }

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      pagination: isPaginated ? {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      } : undefined,
      data: rows
    });
  } catch (error) {
    console.error('Error GET /api/stok-barang:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data stok barang', error: error.message });
  }
});

/**
 * POST /api/stok-barang
 * Menambahkan data stok barang fisik yang sudah ada di klinik dengan validasi ketat
 */
router.post('/', async (req, res) => {
  try {
    const { kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan } = req.body;

    if (!nama_barang || !kategori) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang dan kategori wajib diisi.'
      });
    }

    const cleanTanggal = (tanggal_masuk && isValidDate(tanggal_masuk))
      ? tanggal_masuk
      : new Date().toISOString().split('T')[0];
    const cleanKode = sanitizeString(kode_barang, 50).toUpperCase() || ('BRG-' + Math.floor(1000 + Math.random() * 9000));
    const cleanNama = sanitizeString(nama_barang, 255);
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanJumlah = Math.max(1, parseInt(jumlah, 10) || 1);
    const cleanSatuan = sanitizeString(satuan, 50) || 'unit';
    const cleanKondisi = ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(kondisi) ? kondisi : 'Baik';
    const cleanRuangan = sanitizeString(ruangan, 100) || 'Poli Umum';
    const cleanKeterangan = sanitizeString(keterangan, 255) || 'Stok Awal Klinik';

    if (isSupabase) {
      const { data, error } = await supabase.from('stok_barang').insert([{
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }]).select().single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Stok barang berhasil ditambahkan ke inventaris klinik.',
        data
      });
    }

    // MySQL Insert
    const sql = `
      INSERT INTO stok_barang (kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      cleanKode, cleanNama, cleanKategori, cleanJumlah, cleanSatuan, cleanKondisi, cleanRuangan, cleanTanggal, cleanKeterangan
    ]);

    res.status(201).json({
      success: true,
      message: 'Stok barang berhasil ditambahkan ke inventaris klinik.',
      data: {
        id: result.insertId,
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }
    });
  } catch (error) {
    console.error('Error POST /api/stok-barang:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan stok barang', error: error.message });
  }
});

/**
 * PUT /api/stok-barang/:id
 * Memperbarui data stok barang klinik dengan validasi ketat
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kode_barang, nama_barang, kategori, jumlah, satuan, kondisi, ruangan, tanggal_masuk, keterangan } = req.body;

    if (!nama_barang || !kategori) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang dan kategori wajib diisi.'
      });
    }

    const cleanTanggal = (tanggal_masuk && isValidDate(tanggal_masuk))
      ? tanggal_masuk
      : new Date().toISOString().split('T')[0];
    const cleanKode = sanitizeString(kode_barang, 50).toUpperCase() || ('BRG-' + id);
    const cleanNama = sanitizeString(nama_barang, 255);
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanJumlah = Math.max(1, parseInt(jumlah, 10) || 1);
    const cleanSatuan = sanitizeString(satuan, 50) || 'unit';
    const cleanKondisi = ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(kondisi) ? kondisi : 'Baik';
    const cleanRuangan = sanitizeString(ruangan, 100) || 'Poli Umum';
    const cleanKeterangan = sanitizeString(keterangan, 255) || 'Stok Awal Klinik';

    if (isSupabase) {
      const { data, error } = await supabase.from('stok_barang').update({
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }).eq('id', id).select().single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Data stok barang berhasil diperbarui.',
        data
      });
    }

    // MySQL Update
    const sql = `
      UPDATE stok_barang
      SET kode_barang = ?, nama_barang = ?, kategori = ?, jumlah = ?, satuan = ?, kondisi = ?, ruangan = ?, tanggal_masuk = ?, keterangan = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [
      cleanKode, cleanNama, cleanKategori, cleanJumlah, cleanSatuan, cleanKondisi, cleanRuangan, cleanTanggal, cleanKeterangan, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data stok barang tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Data stok barang berhasil diperbarui.',
      data: {
        id: Number(id),
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        tanggal_masuk: cleanTanggal,
        keterangan: cleanKeterangan
      }
    });
  } catch (error) {
    console.error('Error PUT /api/stok-barang/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui stok barang', error: error.message });
  }
});

/**
 * DELETE /api/stok-barang/:id
 * Menghapus data stok barang
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabase) {
      const { error } = await supabase.from('stok_barang').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true, message: 'Data stok barang berhasil dihapus.' });
    }

    // MySQL Delete
    const [result] = await pool.query('DELETE FROM stok_barang WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data stok barang tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data stok barang berhasil dihapus.' });
  } catch (error) {
    console.error('Error DELETE /api/stok-barang/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus stok barang', error: error.message });
  }
});


module.exports = router;
