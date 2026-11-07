/**
 * ====================================================================
 * ROUTER: TRANSAKSI KAS (PENGELUARAN & PEMASUKAN)
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { isSupabase, supabase, pool } = require('../config/database');
const { isValidDate, sanitizeString, sanitizePostgrestSearch } = require('../middleware/validation');

/**
 * GET /api/transaksi
 * Mengambil semua transaksi dengan opsi filter (tahun, bulan, jenis, kategori, search, rentang tanggal)
 */
router.get('/', async (req, res) => {
  try {
    const { tahun, bulan, jenis, kategori, search, dari_tanggal, sampai_tanggal, page, limit } = req.query;

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));

    if (isSupabase) {
      let q = supabase.from('transaksi').select('*');

      if (jenis && jenis !== 'semua') q = q.eq('jenis', jenis);
      if (kategori && kategori !== 'semua') q = q.eq('kategori', kategori);
      if (dari_tanggal && isValidDate(dari_tanggal)) q = q.gte('tanggal', dari_tanggal);
      if (sampai_tanggal && isValidDate(sampai_tanggal)) q = q.lte('tanggal', sampai_tanggal);
      if (search && search.trim() !== '') {
        const cleanSearch = sanitizePostgrestSearch(search);
        if (cleanSearch) {
          q = q.or(`uraian.ilike.%${cleanSearch}%,kategori.ilike.%${cleanSearch}%`);
        }
      }

      q = q.order('tanggal', { ascending: true }).order('id', { ascending: true });

      const { data, error } = await q;
      if (error) throw error;

      let items = data || [];
      if (tahun && tahun !== 'semua') {
        items = items.filter(i => i.tanggal && i.tanggal.startsWith(String(tahun)));
      }
      if (bulan && bulan !== 'semua') {
        const mStr = String(bulan).padStart(2, '0');
        items = items.filter(i => {
          if (!i.tanggal) return false;
          const p = i.tanggal.split('-');
          return p.length >= 2 && p[1] === mStr;
        });
      }

      const totalCount = items.length;
      const resultData = isPaginated ? items.slice((pageNum - 1) * limitNum, pageNum * limitNum) : items;

      return res.json({
        success: true,
        count: resultData.length,
        pagination: isPaginated ? {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        } : undefined,
        data: resultData
      });
    }

    // MySQL Query
    let query = 'SELECT * FROM transaksi WHERE 1=1';
    const params = [];

    if (tahun && tahun !== 'semua') {
      query += ' AND YEAR(tanggal) = ?';
      params.push(parseInt(tahun, 10));
    }

    if (bulan && bulan !== 'semua') {
      query += ' AND MONTH(tanggal) = ?';
      params.push(parseInt(bulan, 10));
    }

    if (dari_tanggal && isValidDate(dari_tanggal)) {
      query += ' AND tanggal >= ?';
      params.push(dari_tanggal);
    }

    if (sampai_tanggal && isValidDate(sampai_tanggal)) {
      query += ' AND tanggal <= ?';
      params.push(sampai_tanggal);
    }

    if (jenis && jenis !== 'semua') {
      query += ' AND jenis = ?';
      params.push(jenis);
    }

    if (kategori && kategori !== 'semua') {
      query += ' AND kategori = ?';
      params.push(kategori);
    }

    if (search && search.trim() !== '') {
      query += ' AND (uraian LIKE ? OR kategori LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Hitung total jika dipaginasi
    let totalCount = 0;
    if (isPaginated) {
      const countQuery = query.replace('SELECT * FROM transaksi', 'SELECT COUNT(*) as total FROM transaksi');
      const [countRows] = await pool.query(countQuery, params);
      totalCount = countRows[0] ? countRows[0].total : 0;
    }

    query += ' ORDER BY tanggal ASC, id ASC';

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
    console.error('Error GET /api/transaksi:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi', error: error.message });
  }
});

/**
 * POST /api/transaksi
 * Menambahkan data transaksi baru dengan validasi ketat
 */
router.post('/', async (req, res) => {
  try {
    const { tanggal, jenis, kategori, uraian, satuan, nominal, metode } = req.body;

    if (!tanggal || !kategori || !uraian || nominal === undefined || nominal === null) {
      return res.status(400).json({
        success: false,
        message: 'Field tanggal, kategori, uraian, dan nominal wajib diisi.'
      });
    }

    if (!isValidDate(tanggal)) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.'
      });
    }

    const parsedNominal = parseInt(nominal, 10);
    if (isNaN(parsedNominal) || parsedNominal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal transaksi harus berupa angka bilangan bulat positif (>= 0).'
      });
    }

    const cleanJenis = jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanUraian = sanitizeString(uraian, 500);
    const cleanSatuan = sanitizeString(satuan, 50) || '-';
    const cleanNominal = parsedNominal;
    const cleanMetode = metode === 'Transfer' ? 'Transfer' : 'Tunai';

    if (isSupabase) {
      const { data, error } = await supabase.from('transaksi').insert([{
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }]).select().single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Transaksi berhasil ditambahkan.',
        data
      });
    }

    // MySQL Insert
    const sql = `
      INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      tanggal, cleanJenis, cleanKategori, cleanUraian, cleanSatuan, cleanNominal, cleanMetode
    ]);

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil ditambahkan.',
      data: {
        id: result.insertId,
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }
    });
  } catch (error) {
    console.error('Error POST /api/transaksi:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan transaksi', error: error.message });
  }
});

/**
 * PUT /api/transaksi/:id
 * Memperbarui data transaksi yang sudah ada dengan validasi ketat
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, jenis, kategori, uraian, satuan, nominal, metode } = req.body;

    if (!tanggal || !kategori || !uraian || nominal === undefined || nominal === null) {
      return res.status(400).json({
        success: false,
        message: 'Field tanggal, kategori, uraian, dan nominal wajib diisi.'
      });
    }

    if (!isValidDate(tanggal)) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.'
      });
    }

    const parsedNominal = parseInt(nominal, 10);
    if (isNaN(parsedNominal) || parsedNominal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal transaksi harus berupa angka bilangan bulat positif (>= 0).'
      });
    }

    const cleanJenis = jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const cleanKategori = sanitizeString(kategori, 100).toUpperCase();
    const cleanUraian = sanitizeString(uraian, 500);
    const cleanSatuan = sanitizeString(satuan, 50) || '-';
    const cleanNominal = parsedNominal;
    const cleanMetode = metode === 'Transfer' ? 'Transfer' : 'Tunai';

    if (isSupabase) {
      const { data, error } = await supabase.from('transaksi').update({
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }).eq('id', id).select().single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Transaksi berhasil diperbarui.',
        data
      });
    }

    // MySQL Update
    const sql = `
      UPDATE transaksi
      SET tanggal = ?, jenis = ?, kategori = ?, uraian = ?, satuan = ?, nominal = ?, metode = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [
      tanggal, cleanJenis, cleanKategori, cleanUraian, cleanSatuan, cleanNominal, cleanMetode, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil diperbarui.',
      data: {
        id: Number(id),
        tanggal,
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        satuan: cleanSatuan,
        nominal: cleanNominal,
        metode: cleanMetode
      }
    });
  } catch (error) {
    console.error('Error PUT /api/transaksi/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi', error: error.message });
  }
});

/**
 * DELETE /api/transaksi/:id
 * Menghapus transaksi berdasarkan ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabase) {
      const { error } = await supabase.from('transaksi').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true, message: 'Data transaksi berhasil dihapus.' });
    }

    // MySQL Delete
    const [result] = await pool.query('DELETE FROM transaksi WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data transaksi berhasil dihapus.' });
  } catch (error) {
    console.error('Error DELETE /api/transaksi/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi', error: error.message });
  }
});

/**
 * POST /api/transaksi/reset-saldo
 * Mengatur ulang saldo kas klinik secara instan
 */
router.post('/reset-saldo', async (req, res) => {
  try {
    const { target_saldo, tanggal, keterangan, mode } = req.body;
    const cleanTargetSaldo = Math.max(0, parseInt(target_saldo, 10) || 0);
    const cleanTanggal = (tanggal && isValidDate(tanggal)) ? tanggal : new Date().toISOString().split('T')[0];
    const cleanKeterangan = sanitizeString(keterangan, 255) || 'Saldo Awal Kas Klinik';
    const isResetClean = mode === 'bersihkan_dan_set';

    if (isSupabase) {
      if (isResetClean) {
        // 1. Ambil total pengeluaran
        const { data: pengData } = await supabase.from('transaksi').select('nominal').eq('jenis', 'Pengeluaran');
        const totalPengeluaran = (pengData || []).reduce((sum, item) => sum + (parseInt(item.nominal, 10) || 0), 0);

        // 2. Hapus semua data pemasukan lama
        await supabase.from('transaksi').delete().eq('jenis', 'Pemasukan');

        // 3. Masukkan 1 transaksi Pemasukan baru
        const nominalPemasukanBaru = cleanTargetSaldo + totalPengeluaran;
        await supabase.from('transaksi').insert([{
          tanggal: cleanTanggal,
          jenis: 'Pemasukan',
          kategori: 'DANA MASUK',
          uraian: cleanKeterangan,
          satuan: '-',
          nominal: nominalPemasukanBaru,
          metode: 'Transfer'
        }]);

        return res.json({
          success: true,
          message: `Saldo kas berhasil diatur ulang menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            nominal_pemasukan: nominalPemasukanBaru,
            total_pengeluaran: totalPengeluaran
          }
        });
      } else {
        // Mode Penyesuaian Selisih
        const { data: allData } = await supabase.from('transaksi').select('jenis, nominal');
        let totP = 0, totK = 0;
        (allData || []).forEach(x => {
          const n = parseInt(x.nominal, 10) || 0;
          if (x.jenis === 'Pemasukan') totP += n;
          else totK += n;
        });
        const currentSaldo = totP - totK;
        const selisih = cleanTargetSaldo - currentSaldo;

        if (selisih > 0) {
          await supabase.from('transaksi').insert([{
            tanggal: cleanTanggal,
            jenis: 'Pemasukan',
            kategori: 'DANA MASUK',
            uraian: cleanKeterangan || 'Penyesuaian Tambahan Saldo Kas',
            satuan: '-',
            nominal: selisih,
            metode: 'Transfer'
          }]);
        } else if (selisih < 0) {
          await supabase.from('transaksi').insert([{
            tanggal: cleanTanggal,
            jenis: 'Pengeluaran',
            kategori: 'PENYESUAIAN KAS',
            uraian: cleanKeterangan || 'Penyesuaian Koreksi Saldo Kas',
            satuan: '-',
            nominal: Math.abs(selisih),
            metode: 'Tunai'
          }]);
        }

        return res.json({
          success: true,
          message: `Saldo kas berhasil disesuaikan menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: { target_saldo: cleanTargetSaldo, selisih }
        });
      }
    }

    // MySQL Logic dengan Atomic Transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (isResetClean) {
        const [pengeluaranRows] = await conn.query(
          "SELECT COALESCE(SUM(nominal), 0) AS total_pengeluaran FROM transaksi WHERE jenis = 'Pengeluaran'"
        );
        const totalPengeluaran = parseInt(pengeluaranRows[0].total_pengeluaran, 10) || 0;

        await conn.query("DELETE FROM transaksi WHERE jenis = 'Pemasukan'");

        const nominalPemasukanBaru = cleanTargetSaldo + totalPengeluaran;
        await conn.query(
          "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pemasukan', 'DANA MASUK', ?, '-', ?, 'Transfer')",
          [cleanTanggal, cleanKeterangan, nominalPemasukanBaru]
        );

        await conn.commit();

        return res.json({
          success: true,
          message: `Saldo kas berhasil diatur ulang menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            nominal_pemasukan: nominalPemasukanBaru,
            total_pengeluaran: totalPengeluaran
          }
        });
      } else {
        const [pemasukanRows] = await conn.query("SELECT COALESCE(SUM(nominal), 0) AS total FROM transaksi WHERE jenis = 'Pemasukan'");
        const [pengeluaranRows] = await conn.query("SELECT COALESCE(SUM(nominal), 0) AS total FROM transaksi WHERE jenis = 'Pengeluaran'");

        const totalPemasukan = parseInt(pemasukanRows[0].total, 10) || 0;
        const totalPengeluaran = parseInt(pengeluaranRows[0].total, 10) || 0;
        const currentSaldo = totalPemasukan - totalPengeluaran;
        const selisih = cleanTargetSaldo - currentSaldo;

        if (selisih > 0) {
          await conn.query(
            "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pemasukan', 'DANA MASUK', ?, '-', ?, 'Transfer')",
            [cleanTanggal, cleanKeterangan || 'Penyesuaian Tambahan Saldo Kas', selisih]
          );
        } else if (selisih < 0) {
          await conn.query(
            "INSERT INTO transaksi (tanggal, jenis, kategori, uraian, satuan, nominal, metode) VALUES (?, 'Pengeluaran', 'PENYESUAIAN KAS', ?, '-', ?, 'Tunai')",
            [cleanTanggal, cleanKeterangan || 'Penyesuaian Koreksi Saldo Kas', Math.abs(selisih)]
          );
        }

        await conn.commit();

        return res.json({
          success: true,
          message: `Saldo kas berhasil disesuaikan menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            selisih: selisih
          }
        });
      }
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error POST /api/transaksi/reset-saldo:', error);
    res.status(500).json({ success: false, message: 'Gagal mengatur ulang saldo', error: error.message });
  }
});


module.exports = router;
