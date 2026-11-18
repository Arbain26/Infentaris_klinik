/**
 * ====================================================================
 * UNIVERSAL BACKUP FILE PARSER
 * Mendukung File Excel (.xlsx, .xls), PDF (.pdf), CSV (.csv), & JSON (.json)
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

const ExcelJS = require('exceljs');
let PDFParseClass = null;
try {
  const pdfParsePkg = require('pdf-parse');
  PDFParseClass = pdfParsePkg.PDFParse || pdfParsePkg;
} catch (e) {
  console.warn('pdf-parse module warning:', e.message);
}

// Helper untuk konversi tanggal Indonesia ("02 Okt 2026") ke YYYY-MM-DD
function parseTanggalIndo(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  if (str instanceof Date) {
    return str.toISOString().split('T')[0];
  }
  const s = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  // Format DD/MM/YYYY atau DD-MM-YYYY
  const dmMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmMatch) {
    return `${dmMatch[3]}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`;
  }

  // Format Indo: 02 Okt 2026
  const indoMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (indoMatch) {
    const bulanMap = {
      jan: '01', januari: '01', feb: '02', februari: '02',
      mar: '03', maret: '03', apr: '04', april: '04',
      mei: '05', may: '05', jun: '06', juni: '06',
      jul: '07', juli: '07', ags: '08', agu: '08', agustus: '08',
      sep: '09', september: '09', okt: '10', oktober: '10',
      nov: '11', november: '11', des: '12', desember: '12'
    };
    const bKey = indoMatch[2].toLowerCase().substring(0, 3);
    const mm = bulanMap[bKey] || '01';
    return `${indoMatch[3]}-${mm}-${indoMatch[1].padStart(2, '0')}`;
  }
  return s;
}

// Bersihkan nominal string ("Rp 58.000", "58,000", dll) jadi integer
function cleanNominal(val) {
  if (typeof val === 'number') return Math.round(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * 1. Parser Excel (.xlsx, .xls)
 */
async function parseExcelBuffer(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const result = {
    transaksi: [],
    stok_barang: [],
    pengaturan: null
  };

  // Cek apakah ada Sheet Cadangan Multi-Sheet
  let wsTx = wb.getWorksheet('Data Transaksi Kas') || wb.getWorksheet('Transaksi');
  let wsStok = wb.getWorksheet('Stok & Barang Klinik') || wb.getWorksheet('Stok Barang Klinik') || wb.getWorksheet('Stok');
  let wsSet = wb.getWorksheet('Pengaturan & Profil') || wb.getWorksheet('Pengaturan');

  // Format 1: Multi-Sheet Backup Resmi
  if (wsTx) {
    let headerMap = {};
    wsTx.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '').toLowerCase().trim();
          if (val.includes('tanggal') || val.includes('tgl')) headerMap.tanggal = colNumber;
          else if (val.includes('jenis')) headerMap.jenis = colNumber;
          else if (val.includes('kategori')) headerMap.kategori = colNumber;
          else if (val.includes('uraian') || val.includes('keterangan')) headerMap.uraian = colNumber;
          else if (val.includes('satuan')) headerMap.satuan = colNumber;
          else if (val.includes('nominal') || val.includes('harga')) headerMap.nominal = colNumber;
          else if (val.includes('metode')) headerMap.metode = colNumber;
        });
        return;
      }
      const tgl = parseTanggalIndo(row.getCell(headerMap.tanggal || 2).value);
      const uraian = String(row.getCell(headerMap.uraian || 5).value || '').trim();
      const nominal = cleanNominal(row.getCell(headerMap.nominal || 7).value);
      if (uraian && nominal) {
        result.transaksi.push({
          tanggal: tgl,
          jenis: String(row.getCell(headerMap.jenis || 3).value || 'Pengeluaran').trim(),
          kategori: String(row.getCell(headerMap.kategori || 4).value || 'LAIN-LAIN').trim(),
          uraian,
          satuan: String(row.getCell(headerMap.satuan || 6).value || '-').trim(),
          nominal,
          metode: String(row.getCell(headerMap.metode || 8).value || 'Tunai').trim()
        });
      }
    });

    if (wsStok) {
      let sHeaderMap = {};
      wsStok.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            const val = String(cell.value || '').toLowerCase().trim();
            if (val.includes('kode')) sHeaderMap.kode = colNumber;
            else if (val.includes('nama')) sHeaderMap.nama = colNumber;
            else if (val.includes('kategori')) sHeaderMap.kategori = colNumber;
            else if (val.includes('jumlah') || val.includes('unit')) sHeaderMap.jumlah = colNumber;
            else if (val.includes('satuan')) sHeaderMap.satuan = colNumber;
            else if (val.includes('kondisi')) sHeaderMap.kondisi = colNumber;
            else if (val.includes('ruangan')) sHeaderMap.ruangan = colNumber;
            else if (val.includes('tanggal')) sHeaderMap.tanggal = colNumber;
            else if (val.includes('keterangan')) sHeaderMap.keterangan = colNumber;
          });
          return;
        }
        const nama = String(row.getCell(sHeaderMap.nama || 3).value || '').trim();
        if (nama) {
          result.stok_barang.push({
            kode_barang: String(row.getCell(sHeaderMap.kode || 2).value || '-').trim(),
            nama_barang: nama,
            kategori: String(row.getCell(sHeaderMap.kategori || 4).value || 'Umum').trim(),
            jumlah: parseInt(row.getCell(sHeaderMap.jumlah || 5).value, 10) || 0,
            satuan: String(row.getCell(sHeaderMap.satuan || 6).value || 'unit').trim(),
            kondisi: String(row.getCell(sHeaderMap.kondisi || 7).value || 'Baik').trim(),
            ruangan: String(row.getCell(sHeaderMap.ruangan || 8).value || '-').trim(),
            tanggal_masuk: parseTanggalIndo(row.getCell(sHeaderMap.tanggal || 9).value),
            keterangan: String(row.getCell(sHeaderMap.keterangan || 10).value || '-').trim()
          });
        }
      });
    }

    if (wsSet) {
      result.pengaturan = {};
      wsSet.eachRow((row) => {
        const k = String(row.getCell(1).value || '').trim();
        const v = String(row.getCell(2).value || '').trim();
        if (k && v) {
          if (k.toLowerCase().includes('nama klinik')) result.pengaturan.nama_klinik = v;
          else if (k.toLowerCase().includes('alamat')) result.pengaturan.alamat = v;
          else if (k.toLowerCase().includes('email')) result.pengaturan.email = v;
          else if (k.toLowerCase().includes('telepon')) result.pengaturan.telepon = v;
        }
      });
    }

    return result;
  }

  // Format 2: Laporan Sheet (seperti Laporan Inventaris) atau Single-Sheet Table
  const sheet = wb.worksheets[0];
  if (!sheet) return result;

  let currentCategory = 'ALAT KANTOR';
  let totalPemasukanVal = 0;
  let firstDate = '';

  sheet.eachRow((row) => {
    let rowValues = [];
    row.eachCell({ includeEmpty: true }, (c) => rowValues.push(c.value));
    const fullRowText = rowValues.map(v => (v !== null && v !== undefined ? String(v) : '')).join(' ');

    // Cek Kategori
    const katMatch = fullRowText.match(/KATEGORI:\s*([A-Za-z0-9\s-]+)/i);
    if (katMatch) {
      currentCategory = katMatch[1].trim();
      return;
    }

    // Cek Rekapitulasi Total Pemasukan
    if (/Total Pemasukan|Dana Kas|Saldo Awal/i.test(fullRowText)) {
      for (let v of rowValues) {
        const nom = cleanNominal(v);
        if (nom > 0 && nom !== 3173000 && nom > 1000) { // filter
          totalPemasukanVal = nom;
        } else if (nom > 0) {
          totalPemasukanVal = nom;
        }
      }
      return;
    }

    // Cek baris transaksi: biasanya kolom A=No, B=Tanggal, C=Uraian, D=Satuan, E=Metode, F=Nominal
    // atau tergeser 1 kolom
    for (let i = 1; i <= Math.min(rowValues.length, 6); i++) {
      const cellVal = row.getCell(i).value;
      const nextVal = row.getCell(i + 1).value;
      const uraianVal = row.getCell(i + 2).value;
      const satVal = row.getCell(i + 3).value;
      const metVal = row.getCell(i + 4).value;
      const nomVal = row.getCell(i + 5).value;

      if ((typeof cellVal === 'number' || /^\d+$/.test(String(cellVal).trim())) && nextVal && uraianVal && nomVal) {
        const tglStr = parseTanggalIndo(nextVal);
        const nom = cleanNominal(nomVal);
        const ur = String(uraianVal).trim();
        if (nom > 0 && ur && !/total|jumlah/i.test(ur)) {
          if (!firstDate) firstDate = tglStr;
          result.transaksi.push({
            tanggal: tglStr,
            jenis: 'Pengeluaran',
            kategori: currentCategory,
            uraian: ur,
            satuan: String(satVal || '-').trim(),
            metode: String(metVal || 'Tunai').trim(),
            nominal: nom
          });
          break;
        }
      }
    }
  });

  if (totalPemasukanVal > 0) {
    result.transaksi.push({
      tanggal: firstDate || new Date().toISOString().split('T')[0],
      jenis: 'Pemasukan',
      kategori: 'DANA MASUK',
      uraian: 'Saldo Awal Kas Klinik',
      satuan: '-',
      metode: 'Tunai',
      nominal: totalPemasukanVal
    });
  }

  return result;
}

/**
 * 2. Parser CSV / Text
 */
function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/);
  const result = {
    transaksi: [],
    stok_barang: [],
    pengaturan: null
  };

  let currentCategory = 'ALAT KANTOR';
  let totalPemasukanVal = 0;
  let firstDate = '';

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Kategori
    const katMatch = trimmed.match(/KATEGORI:\s*([^,;]+)/i);
    if (katMatch) {
      currentCategory = katMatch[1].trim();
      continue;
    }

    // Rekapitulasi
    if (/Total Pemasukan|Dana Kas|Saldo Awal/i.test(trimmed)) {
      const parts = trimmed.split(/[,;\t]/);
      for (let p of parts) {
        const nom = cleanNominal(p);
        if (nom > 0) totalPemasukanVal = nom;
      }
      continue;
    }

    // Baris Transaksi CSV
    const parts = trimmed.split(/[,;\t]/);
    if (parts.length >= 6) {
      const col0 = parts[0].trim();
      if (/^\d+$/.test(col0)) {
        const tgl = parseTanggalIndo(parts[1].trim());
        const uraian = parts[2].trim();
        const satuan = parts[3].trim();
        const metode = parts[4].trim();
        const nominal = cleanNominal(parts[5]);

        if (uraian && nominal > 0) {
          if (!firstDate) firstDate = tgl;
          result.transaksi.push({
            tanggal: tgl,
            jenis: 'Pengeluaran',
            kategori: currentCategory,
            uraian,
            satuan: satuan || '-',
            metode: metode || 'Tunai',
            nominal
          });
        }
      }
    }
  }

  if (totalPemasukanVal > 0) {
    result.transaksi.push({
      tanggal: firstDate || new Date().toISOString().split('T')[0],
      jenis: 'Pemasukan',
      kategori: 'DANA MASUK',
      uraian: 'Saldo Awal Kas Klinik',
      satuan: '-',
      metode: 'Tunai',
      nominal: totalPemasukanVal
    });
  }

  return result;
}

/**
 * 3. Parser PDF (.pdf)
 */
async function parsePdfBuffer(buffer) {
  if (!PDFParseClass) {
    throw new Error('Pustaka parser PDF (pdf-parse) belum terpasang di server');
  }

  const parser = new PDFParseClass(new Uint8Array(buffer));
  const res = await parser.getText();
  const rawText = res.text || '';

  const result = {
    transaksi: [],
    stok_barang: [],
    pengaturan: null
  };

  const lines = rawText.split(/\r?\n/);
  let currentCategory = 'ALAT KANTOR';
  let totalPemasukanVal = 0;
  let firstDate = '';

  const regexItem = /^(\d+)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}|\d{2}[/-]\d{2}[/-]\d{4})\s+(.+?)\s+([a-zA-Z0-9/]+|-)\s+(Tunai|Transfer)\s+(?:Rp\.?\s*)?([\d.,]+)$/i;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Kategori
    const katMatch = trimmed.match(/KATEGORI:\s*([A-Za-z0-9\s-]+)/i);
    if (katMatch) {
      currentCategory = katMatch[1].trim();
      continue;
    }

    // Rekapitulasi Total Pemasukan
    const matchPem = trimmed.match(/(?:Total Pemasukan|Dana Kas|Saldo Awal).*?(?:Rp\.?\s*)?([\d.,]+)/i);
    if (matchPem) {
      const nom = cleanNominal(matchPem[1]);
      if (nom > 0) totalPemasukanVal = nom;
      continue;
    }

    // Cek Baris Transaksi
    const itemMatch = trimmed.match(regexItem);
    if (itemMatch) {
      const tgl = parseTanggalIndo(itemMatch[2]);
      const ur = itemMatch[3].trim();
      const sat = itemMatch[4].trim();
      const met = itemMatch[5].trim();
      const nom = cleanNominal(itemMatch[6]);

      if (ur && nom > 0) {
        if (!firstDate) firstDate = tgl;
        result.transaksi.push({
          tanggal: tgl,
          jenis: 'Pengeluaran',
          kategori: currentCategory,
          uraian: ur,
          satuan: sat || '-',
          metode: met || 'Tunai',
          nominal: nom
        });
      }
    }
  }

  if (totalPemasukanVal > 0) {
    result.transaksi.push({
      tanggal: firstDate || new Date().toISOString().split('T')[0],
      jenis: 'Pemasukan',
      kategori: 'DANA MASUK',
      uraian: 'Saldo Awal Kas Klinik',
      satuan: '-',
      metode: 'Tunai',
      nominal: totalPemasukanVal
    });
  }

  return result;
}

/**
 * 4. Universal Auto-Detector
 */
async function parseAnyBackupFile(filename, buffer) {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  if (ext === 'json') {
    const jsonStr = buffer.toString('utf8');
    const data = JSON.parse(jsonStr);
    return {
      transaksi: data.transaksi || (Array.isArray(data) ? data : []),
      stok_barang: data.stok_barang || [],
      pengaturan: data.pengaturan || null
    };
  } else if (ext === 'xlsx' || ext === 'xls') {
    return await parseExcelBuffer(buffer);
  } else if (ext === 'pdf') {
    return await parsePdfBuffer(buffer);
  } else if (ext === 'csv' || ext === 'txt') {
    const text = buffer.toString('utf8');
    return parseCsvText(text);
  } else {
    throw new Error(`Format file .${ext} tidak didukung. Harap gunakan file .xlsx, .pdf, .csv, atau .json.`);
  }
}

module.exports = {
  parseAnyBackupFile,
  parseExcelBuffer,
  parsePdfBuffer,
  parseCsvText,
  parseTanggalIndo,
  cleanNominal
};

