import ExcelJS from 'exceljs';
import { Transaksi, PengaturanKlinik } from './types';
import { LOGO_AISYIYAH_BASE64 } from './logo-data';
import { formatDateIndo } from './utils';

export async function exportToExcel(
  transaksiList: Transaksi[],
  pengaturan: PengaturanKlinik,
  filterInfo: {
    tahun?: string;
    bulan?: string;
    dari_tanggal?: string;
    sampai_tanggal?: string;
  }
) {
  const pengeluaranItems = transaksiList.filter((i) => i.jenis === 'Pengeluaran');

  const bulanNama = [
    '',
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  let periodeTxt =
    !filterInfo.tahun || filterInfo.tahun === 'semua'
      ? 'SEMUA PERIODE'
      : `TAHUN ANGGARAN ${filterInfo.tahun}`;

  if (filterInfo.bulan && filterInfo.bulan !== 'semua') {
    const mIdx = parseInt(filterInfo.bulan, 10);
    if (mIdx >= 1 && mIdx <= 12) {
      periodeTxt += ` (BULAN ${bulanNama[mIdx].toUpperCase()})`;
    }
  }

  if (filterInfo.dari_tanggal || filterInfo.sampai_tanggal) {
    if (filterInfo.dari_tanggal && filterInfo.sampai_tanggal) {
      periodeTxt = `PERIODE ${formatDateIndo(filterInfo.dari_tanggal).toUpperCase()} S/D ${formatDateIndo(filterInfo.sampai_tanggal).toUpperCase()}`;
    } else if (filterInfo.dari_tanggal) {
      periodeTxt = `PERIODE MULAI ${formatDateIndo(filterInfo.dari_tanggal).toUpperCase()}`;
    } else if (filterInfo.sampai_tanggal) {
      periodeTxt = `PERIODE SAMPAI ${formatDateIndo(filterInfo.sampai_tanggal).toUpperCase()}`;
    }
  }

  const cleanClinicName = (pengaturan?.nama_klinik || 'Klinik').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Inventaris_${cleanClinicName}_${filterInfo.tahun || 'Semua'}.xlsx`;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Laporan Inventaris', {
    views: [{ showGridLines: true }],
  });

  // Embed Logo
  try {
    const logoId = wb.addImage({
      base64: LOGO_AISYIYAH_BASE64,
      extension: 'png',
    });
    ws.addImage(logoId, {
      tl: { col: 0.15, row: 0.15 },
      ext: { width: 56, height: 56 },
    });
  } catch (err) {
    console.warn('Gagal menyematkan gambar ke ExcelJS:', err);
  }

  // Row heights
  ws.getRow(1).height = 22;
  ws.getRow(2).height = 16;
  ws.getRow(3).height = 16;
  ws.getRow(4).height = 8;
  ws.getRow(5).height = 20;
  ws.getRow(6).height = 18;
  ws.getRow(7).height = 10;

  // Header Texts
  ws.mergeCells('B1:F1');
  const cellNama = ws.getCell('B1');
  cellNama.value = (pengaturan?.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE').toUpperCase();
  cellNama.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  cellNama.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('B2:F2');
  const cellAlamat = ws.getCell('B2');
  cellAlamat.value =
    pengaturan?.alamat ||
    'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan';
  cellAlamat.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
  cellAlamat.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('B3:F3');
  const cellKontak = ws.getCell('B3');
  cellKontak.value = `Email: ${pengaturan?.email || 'klinikaisyiyahpangkajene@gmail.com'}   Hp. ${pengaturan?.telepon || '0878-3117-7100'}`;
  cellKontak.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
  cellKontak.alignment = { horizontal: 'center', vertical: 'middle' };

  // Divider line
  ws.mergeCells('A4:F4');
  const sepCell = ws.getCell('A4');
  sepCell.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };

  // Title
  ws.mergeCells('A5:F5');
  const cellJudul = ws.getCell('A5');
  cellJudul.value = 'LAPORAN INVENTARIS DAN PENGELUARAN OPERASIONAL';
  cellJudul.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };
  cellJudul.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('A6:F6');
  const cellPeriode = ws.getCell('A6');
  cellPeriode.value = `PERIODE : ${periodeTxt}`;
  cellPeriode.font = { name: 'Calibri', size: 10, bold: true, italic: true, color: { argb: 'FF047857' } };
  cellPeriode.alignment = { horizontal: 'center', vertical: 'middle' };

  // Columns Width
  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'tgl', width: 16 },
    { key: 'uraian', width: 44 },
    { key: 'satuan', width: 12 },
    { key: 'metode', width: 14 },
    { key: 'nominal', width: 24 },
  ];

  // Header Row
  let r = 8;
  const headers = ['No', 'Tanggal', 'Jenis Barang / Uraian', 'Satuan', 'Metode', 'Harga / Nominal (Rp)'];
  const headerRow = ws.getRow(r);
  headerRow.height = 24;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  r++;

  // Group by category
  const groups: Record<string, Transaksi[]> = {};
  pengeluaranItems.forEach((item) => {
    const kat = (item.kategori || 'LAIN-LAIN').trim().toUpperCase();
    if (!groups[kat]) groups[kat] = [];
    groups[kat].push(item);
  });

  let grandTotal = 0;
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  Object.keys(groups)
    .sort()
    .forEach((kat) => {
      const items = groups[kat];
      let subTotal = 0;

      // Subheader category
      const subRow = ws.getRow(r);
      subRow.height = 20;
      ws.mergeCells(`A${r}:E${r}`);
      const catCell = ws.getCell(`A${r}`);
      catCell.value = `KATEGORI: ${kat}`;
      catCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
      catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      catCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      const emptyRight = ws.getCell(`F${r}`);
      emptyRight.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      emptyRight.border = borderThin;
      r++;

      items.forEach((item, idx) => {
        const itemRow = ws.getRow(r);
        itemRow.height = 18;
        const nom = Number(item.nominal) || 0;
        subTotal += nom;
        grandTotal += nom;

        const cells = [
          { val: idx + 1, align: 'center' },
          { val: item.tanggal, align: 'center' },
          { val: item.uraian, align: 'left' },
          { val: item.satuan || '-', align: 'center' },
          { val: item.metode || 'Tunai', align: 'center' },
          { val: nom, align: 'right', format: '#,##0' },
        ];

        cells.forEach((c, cIdx) => {
          const cell = itemRow.getCell(cIdx + 1);
          cell.value = c.val;
          cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF1E293B' } };
          cell.alignment = { horizontal: c.align as any, vertical: 'middle' };
          cell.border = borderThin;
          if (c.format) cell.numFmt = c.format;
        });

        r++;
      });

      // Subtotal Row
      const subTotalRow = ws.getRow(r);
      subTotalRow.height = 19;
      ws.mergeCells(`A${r}:E${r}`);
      const lblSub = ws.getCell(`A${r}`);
      lblSub.value = `SUBTOTAL ${kat}`;
      lblSub.font = { name: 'Calibri', size: 9, bold: true, italic: true, color: { argb: 'FF334155' } };
      lblSub.alignment = { horizontal: 'right', vertical: 'middle' };
      lblSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

      const valSub = ws.getCell(`F${r}`);
      valSub.value = subTotal;
      valSub.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
      valSub.numFmt = '#,##0';
      valSub.alignment = { horizontal: 'right', vertical: 'middle' };
      valSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      valSub.border = borderThin;
      r++;
    });

  // Grand Total Row
  const gtRow = ws.getRow(r);
  gtRow.height = 22;
  ws.mergeCells(`A${r}:E${r}`);
  const lblGt = ws.getCell(`A${r}`);
  lblGt.value = 'TOTAL KESELURUHAN PENGELUARAN';
  lblGt.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  lblGt.alignment = { horizontal: 'right', vertical: 'middle' };
  lblGt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  const valGt = ws.getCell(`F${r}`);
  valGt.value = grandTotal;
  valGt.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  valGt.numFmt = '#,##0';
  valGt.alignment = { horizontal: 'right', vertical: 'middle' };
  valGt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  r += 2;

  // Signature Block
  const kota = pengaturan?.kota || 'Pangkajene';
  const now = new Date();
  const dateStr = formatDateIndo(now.toISOString().split('T')[0]);

  ws.mergeCells(`D${r}:F${r}`);
  const signDateCell = ws.getCell(`D${r}`);
  signDateCell.value = `${kota}, ${dateStr}`;
  signDateCell.font = { name: 'Calibri', size: 10 };
  signDateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  r++;

  ws.mergeCells(`A${r}:C${r}`);
  const signLeftRole = ws.getCell(`A${r}`);
  signLeftRole.value = pengaturan?.jabatan_kiri || 'Kepala Klinik';
  signLeftRole.font = { name: 'Calibri', size: 10, bold: true };
  signLeftRole.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`D${r}:F${r}`);
  const signRightRole = ws.getCell(`D${r}`);
  signRightRole.value = pengaturan?.jabatan_kanan || 'Pemegang Barang';
  signRightRole.font = { name: 'Calibri', size: 10, bold: true };
  signRightRole.alignment = { horizontal: 'center', vertical: 'middle' };
  r += 4;

  ws.mergeCells(`A${r}:C${r}`);
  const signLeftName = ws.getCell(`A${r}`);
  signLeftName.value = pengaturan?.nama_kiri || 'dr. Syah Rizal Syam Pohan';
  signLeftName.font = { name: 'Calibri', size: 10, bold: true, underline: true };
  signLeftName.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`D${r}:F${r}`);
  const signRightName = ws.getCell(`D${r}`);
  signRightName.value = pengaturan?.nama_kanan || 'Hera A.md.Keb';
  signRightName.font = { name: 'Calibri', size: 10, bold: true, underline: true };
  signRightName.alignment = { horizontal: 'center', vertical: 'middle' };
  r++;

  if (pengaturan?.nip_kiri) {
    ws.mergeCells(`A${r}:C${r}`);
    const signLeftNip = ws.getCell(`A${r}`);
    signLeftNip.value = pengaturan.nip_kiri;
    signLeftNip.font = { name: 'Calibri', size: 9, italic: true };
    signLeftNip.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

