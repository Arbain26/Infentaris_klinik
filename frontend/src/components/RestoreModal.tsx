'use client';

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { api } from '@/lib/api';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper parsing tanggal Indonesia / standar
function parseDateString(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY atau DD-MM-YYYY
  const dmMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmMatch) {
    return `${dmMatch[3]}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`;
  }

  // Indo: 02 Okt 2026 / 2 Oktober 2026
  const indoMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (indoMatch) {
    const bulanMap: Record<string, string> = {
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

function cleanNominal(val: any): number {
  if (typeof val === 'number') return Math.round(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fileData, setFileData] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileExt, setFileExt] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'append' | 'replace'>('append');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Parser Excel (.xlsx, .xls)
  const parseExcel = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuffer);

    const result: { transaksi: any[]; stok_barang: any[]; pengaturan_klinik: any } = {
      transaksi: [],
      stok_barang: [],
      pengaturan_klinik: null,
    };

    const wsTx = wb.getWorksheet('Data Transaksi Kas') || wb.getWorksheet('Transaksi');
    const wsStok = wb.getWorksheet('Stok & Barang Klinik') || wb.getWorksheet('Stok Barang Klinik') || wb.getWorksheet('Stok');

    if (wsTx) {
      let headerMap: Record<string, number> = {};
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
        const tgl = parseDateString(row.getCell(headerMap.tanggal || 2).value);
        const uraian = String(row.getCell(headerMap.uraian || 5).value || '').trim();
        const nominal = cleanNominal(row.getCell(headerMap.nominal || 7).value);
        if (uraian && nominal) {
          result.transaksi.push({
            tanggal: tgl,
            jenis: String(row.getCell(headerMap.jenis || 3).value || 'Pengeluaran').trim(),
            kategori: String(row.getCell(headerMap.kategori || 4).value || 'LAIN-LAIN').trim(),
            uraian,
            satuan: String(row.getCell(headerMap.satuan || 6).value || 'Unit').trim(),
            nominal,
            metode: String(row.getCell(headerMap.metode || 8).value || 'Tunai').trim(),
          });
        }
      });

      if (wsStok) {
        let sHeaderMap: Record<string, number> = {};
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
            });
            return;
          }
          const nama = String(row.getCell(sHeaderMap.nama || 3).value || '').trim();
          if (nama) {
            result.stok_barang.push({
              kode_barang: String(row.getCell(sHeaderMap.kode || 2).value || '-').trim(),
              nama_barang: nama,
              kategori: String(row.getCell(sHeaderMap.kategori || 4).value || 'Umum').trim(),
              jumlah: parseInt(String(row.getCell(sHeaderMap.jumlah || 5).value), 10) || 0,
              satuan: String(row.getCell(sHeaderMap.satuan || 6).value || 'Unit').trim(),
              kondisi: String(row.getCell(sHeaderMap.kondisi || 7).value || 'Baik').trim(),
              ruangan: String(row.getCell(sHeaderMap.ruangan || 8).value || '-').trim(),
            });
          }
        });
      }

      return result;
    }

    // Format Laporan / Baris Kategori
    const sheet = wb.worksheets[0];
    if (!sheet) return result;

    let currentCategory = 'ALAT KANTOR';
    let totalPemasukan = 0;
    let firstDate = '';

    sheet.eachRow((row) => {
      const rowValues: any[] = [];
      row.eachCell({ includeEmpty: true }, (c) => rowValues.push(c.value));
      const fullText = rowValues.map((v) => (v !== null && v !== undefined ? String(v) : '')).join(' ');

      const katMatch = fullText.match(/KATEGORI:\s*([A-Za-z0-9\s-]+)/i);
      if (katMatch) {
        currentCategory = katMatch[1].trim();
        return;
      }

      if (/Total Pemasukan|Dana Kas|Saldo Awal/i.test(fullText)) {
        for (const v of rowValues) {
          const nom = cleanNominal(v);
          if (nom > 0) totalPemasukan = nom;
        }
        return;
      }

      for (let i = 1; i <= Math.min(rowValues.length, 6); i++) {
        const c1 = row.getCell(i).value;
        const c2 = row.getCell(i + 1).value;
        const c3 = row.getCell(i + 2).value;
        const c4 = row.getCell(i + 3).value;
        const c5 = row.getCell(i + 4).value;
        const c6 = row.getCell(i + 5).value;

        if ((typeof c1 === 'number' || /^\d+$/.test(String(c1).trim())) && c2 && c3 && c6) {
          const tgl = parseDateString(c2);
          const nom = cleanNominal(c6);
          const ur = String(c3).trim();
          if (nom > 0 && ur && !/total|jumlah/i.test(ur)) {
            if (!firstDate) firstDate = tgl;
            result.transaksi.push({
              tanggal: tgl,
              jenis: 'Pengeluaran',
              kategori: currentCategory,
              uraian: ur,
              satuan: String(c4 || 'Unit').trim(),
              metode: String(c5 || 'Tunai').trim(),
              nominal: nom,
            });
            break;
          }
        }
      }
    });

    if (totalPemasukan > 0) {
      result.transaksi.push({
        tanggal: firstDate || new Date().toISOString().split('T')[0],
        jenis: 'Pemasukan',
        kategori: 'DANA MASUK',
        uraian: 'Saldo Awal Kas Klinik',
        satuan: '-',
        metode: 'Tunai',
        nominal: totalPemasukan,
      });
    }

    return result;
  };

  // 2. Parser PDF (.pdf) via CDN
  const parsePdf = async (file: File) => {
    let pdfjs = (window as any).pdfjsLib;
    if (!pdfjs) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = () => {
          pdfjs = (window as any).pdfjsLib;
          if (pdfjs) {
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
          } else {
            reject(new Error('Gagal menginisialisasi pdf.js'));
          }
        };
        s.onerror = () => reject(new Error('Gagal memuat pustaka pembaca PDF'));
        document.head.appendChild(s);
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const rawLines: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const lineMap: Record<number, string[]> = {};
      textContent.items.forEach((item: any) => {
        const y = Math.round(item.transform[5]);
        if (!lineMap[y]) lineMap[y] = [];
        lineMap[y].push(item.str);
      });
      const sortedY = Object.keys(lineMap).sort((a, b) => Number(b) - Number(a));
      sortedY.forEach((y) => {
        const line = lineMap[Number(y)].join(' ').trim();
        if (line) rawLines.push(line);
      });
    }

    const result: { transaksi: any[]; stok_barang: any[]; pengaturan_klinik: any } = {
      transaksi: [],
      stok_barang: [],
      pengaturan_klinik: null,
    };

    let currentCategory = 'ALAT KANTOR';
    let totalPemasukan = 0;
    let firstDate = '';
    const regexItem = /^(\d+)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}|\d{2}[/-]\d{2}[/-]\d{4})\s+(.+?)\s+([a-zA-Z0-9/]+|-)\s+(Tunai|Transfer)\s+(?:Rp\.?\s*)?([\d.,]+)$/i;

    for (const line of rawLines) {
      const katMatch = line.match(/KATEGORI:\s*([A-Za-z0-9\s-]+)/i);
      if (katMatch) {
        currentCategory = katMatch[1].trim();
        continue;
      }

      const pemMatch = line.match(/(?:Total Pemasukan|Dana Kas|Saldo Awal).*?(?:Rp\.?\s*)?([\d.,]+)/i);
      if (pemMatch) {
        const nom = cleanNominal(pemMatch[1]);
        if (nom > 0) totalPemasukan = nom;
        continue;
      }

      const itemMatch = line.match(regexItem);
      if (itemMatch) {
        const tgl = parseDateString(itemMatch[2]);
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
            satuan: sat || 'Unit',
            metode: met || 'Tunai',
            nominal: nom,
          });
        }
      }
    }

    if (totalPemasukan > 0) {
      result.transaksi.push({
        tanggal: firstDate || new Date().toISOString().split('T')[0],
        jenis: 'Pemasukan',
        kategori: 'DANA MASUK',
        uraian: 'Saldo Awal Kas Klinik',
        satuan: '-',
        metode: 'Tunai',
        nominal: totalPemasukan,
      });
    }

    return result;
  };

  // 3. Parser CSV (.csv)
  const parseCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const result: { transaksi: any[]; stok_barang: any[]; pengaturan_klinik: any } = {
      transaksi: [],
      stok_barang: [],
      pengaturan_klinik: null,
    };

    let currentCategory = 'ALAT KANTOR';
    let totalPemasukan = 0;
    let firstDate = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const katMatch = trimmed.match(/KATEGORI:\s*([^,;]+)/i);
      if (katMatch) {
        currentCategory = katMatch[1].trim();
        continue;
      }

      if (/Total Pemasukan|Dana Kas|Saldo Awal/i.test(trimmed)) {
        const parts = trimmed.split(/[,;\t]/);
        for (const p of parts) {
          const nom = cleanNominal(p);
          if (nom > 0) totalPemasukan = nom;
        }
        continue;
      }

      const parts = trimmed.split(/[,;\t]/);
      if (parts.length >= 6) {
        const col0 = parts[0].trim();
        if (/^\d+$/.test(col0)) {
          const tgl = parseDateString(parts[1].trim());
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
              satuan: satuan || 'Unit',
              metode: metode || 'Tunai',
              nominal,
            });
          }
        }
      }
    }

    if (totalPemasukan > 0) {
      result.transaksi.push({
        tanggal: firstDate || new Date().toISOString().split('T')[0],
        jenis: 'Pemasukan',
        kategori: 'DANA MASUK',
        uraian: 'Saldo Awal Kas Klinik',
        satuan: '-',
        metode: 'Tunai',
        nominal: totalPemasukan,
      });
    }

    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);
    setFileName(file.name);
    setFileSizeStr(`${(file.size / 1024).toFixed(1)} KB`);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    setFileExt(ext);
    setAnalyzing(true);

    try {
      let parsed: any = null;
      if (ext === 'xlsx' || ext === 'xls') {
        parsed = await parseExcel(file);
      } else if (ext === 'pdf') {
        parsed = await parsePdf(file);
      } else if (ext === 'csv' || ext === 'txt') {
        parsed = await parseCsv(file);
      } else if (ext === 'json') {
        const text = await file.text();
        const json = JSON.parse(text);
        parsed = json.data || json;
      } else {
        throw new Error(`Format berkas .${ext} tidak didukung. Harap pilih file .xlsx, .pdf, .csv, atau .json.`);
      }

      if (!parsed || (!parsed.transaksi?.length && !parsed.stok_barang?.length && !parsed.pengaturan_klinik)) {
        throw new Error('Tidak ditemukan data transaksi atau stok yang dapat dipulihkan dari berkas ini.');
      }

      setFileData(parsed);
    } catch (err: any) {
      setError(err.message || 'Gagal membaca isi berkas cadangan');
      setFileData(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRestore = async () => {
    if (!fileData) {
      setError('Pilih berkas cadangan terlebih dahulu');
      return;
    }

    const countTx = Array.isArray(fileData.transaksi) ? fileData.transaksi.length : 0;
    const countStok = Array.isArray(fileData.stok_barang) ? fileData.stok_barang.length : 0;
    const confirmMsg =
      restoreMode === 'replace'
        ? `PERINGATAN: Mode "Ganti Seluruh Data" akan MENGOSONGKAN data lama dan memulihkan ${countTx} transaksi baru ke database. Lanjutkan?`
        : `Konfirmasi: Tambahkan ${countTx} transaksi dan ${countStok} stok dari berkas ke database?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        mode: restoreMode,
        transaksi: fileData.transaksi || [],
        stok_barang: fileData.stok_barang || [],
        pengaturan_klinik: fileData.pengaturan_klinik || fileData.pengaturan || null,
      };

      const res = await api.restoreBackup(payload);
      setSuccessMsg(res.message || 'Data cadangan berhasil dipulihkan!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal memulihkan data cadangan');
    } finally {
      setLoading(false);
    }
  };

  const rootData = fileData ? fileData.data || fileData : null;
  const transaksiList = Array.isArray(rootData?.transaksi) ? rootData.transaksi : [];
  const countTransaksi = transaksiList.length;
  const countStok = Array.isArray(rootData?.stok_barang) ? rootData.stok_barang.length : 0;

  let totalPengeluaran = 0;
  let totalPemasukan = 0;
  transaksiList.forEach((t: any) => {
    const nom = cleanNominal(t.nominal);
    if (t.jenis === 'Pemasukan') totalPemasukan += nom;
    else totalPengeluaran += nom;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 my-6">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Pulihkan Cadangan Data (Restore)</h2>
              <p className="text-[11px] text-slate-500">Mendukung berkas Excel (.xlsx), PDF (.pdf), CSV, & JSON (.json)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Format Badges */}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx, .xls)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <FileText className="w-3.5 h-3.5" /> PDF Laporan (.pdf)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
              <FileCode className="w-3.5 h-3.5" /> Berkas CSV (.csv)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Layers className="w-3.5 h-3.5" /> JSON (.json)
            </span>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-indigo-50/20 transition-all text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {fileName ? fileName : 'Pilih Berkas Cadangan (Excel, PDF, CSV, atau JSON)'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Klik untuk memilih berkas cadangan dari perangkat Anda
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Analyzing Spinner */}
          {analyzing && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-center gap-2 text-indigo-700 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menganalisis berkas dan mengekstrak data transaksi...</span>
            </div>
          )}

          {/* Preview Data Terbaca */}
          {fileData && (
            <div className="space-y-3">
              
              {/* File Info Card */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold uppercase text-[10px]">
                    {fileExt || 'DATA'}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{fileName}</span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">{fileSizeStr}</span>
              </div>

              {/* Statistik Ringkasan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Transaksi</span>
                  <span className="font-extrabold text-slate-900">{countTransaksi} baris</span>
                </div>
                <div className="p-2 bg-rose-50/60 rounded-xl border border-rose-100">
                  <span className="text-rose-500 block text-[10px]">Pengeluaran</span>
                  <span className="font-extrabold text-rose-700 text-[11px]">Rp {totalPengeluaran.toLocaleString('id-ID')}</span>
                </div>
                <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-emerald-500 block text-[10px]">Pemasukan</span>
                  <span className="font-extrabold text-emerald-700 text-[11px]">Rp {totalPemasukan.toLocaleString('id-ID')}</span>
                </div>
                <div className="p-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-indigo-500 block text-[10px]">Stok Aset</span>
                  <span className="font-extrabold text-indigo-700">{countStok} barang</span>
                </div>
              </div>

              {/* Mode Pemulihan (Append vs Replace) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">Pilih Metode Pemulihan:</p>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-indigo-300">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="append"
                      checked={restoreMode === 'append'}
                      onChange={() => setRestoreMode('append')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Tambahkan ke Data Saat Ini (Append)</p>
                      <p className="text-[11px] text-slate-500 leading-tight">Data lama tetap tersimpan, data dari berkas akan ditambahkan.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-rose-300">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="replace"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-rose-700">Ganti Seluruh Data (Reset & Restore)</p>
                      <p className="text-[11px] text-slate-500 leading-tight">Kosongkan database dan isi ulang hanya dengan data berkas ini.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tabel Pratinjau 4 Baris Pertama */}
              {transaksiList.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-600 mb-1">Pratinjau Data Terdeteksi:</p>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-32 overflow-y-auto bg-white text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="p-1.5 text-center">Tgl</th>
                          <th className="p-1.5">Kategori</th>
                          <th className="p-1.5">Uraian</th>
                          <th className="p-1.5 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transaksiList.slice(0, 4).map((item: any, idx: number) => {
                          const isPem = item.jenis === 'Pemasukan';
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-1.5 text-center text-slate-500 whitespace-nowrap">{item.tanggal || '-'}</td>
                              <td className="p-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isPem ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                  {item.kategori || '-'}
                                </span>
                              </td>
                              <td className="p-1.5 font-medium text-slate-800 truncate max-w-[150px]">{item.uraian}</td>
                              <td className={`p-1.5 text-right font-bold whitespace-nowrap ${isPem ? 'text-emerald-600' : 'text-slate-800'}`}>
                                Rp {cleanNominal(item.nominal).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!fileData || loading || analyzing}
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memulihkan Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Mulai Pemulihan</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
