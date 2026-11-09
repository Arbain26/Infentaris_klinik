import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaksi, PengaturanKlinik } from './types';
import { LOGO_AISYIYAH_BASE64 } from './logo-data';
import { formatDateIndo, formatRupiah } from './utils';

export function exportToPDF(
  transaksiList: Transaksi[],
  pengaturan: PengaturanKlinik,
  filterInfo: {
    tahun?: string;
    bulan?: string;
    dari_tanggal?: string;
    sampai_tanggal?: string;
  }
) {
  const doc = new jsPDF('p', 'mm', 'a4'); // A4 Portrait
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

  let tahunAnggaranStr =
    !filterInfo.tahun || filterInfo.tahun === 'semua' ? 'SEMUA TAHUN' : filterInfo.tahun;

  if (filterInfo.bulan && filterInfo.bulan !== 'semua') {
    const mIdx = parseInt(filterInfo.bulan, 10);
    if (mIdx >= 1 && mIdx <= 12) {
      tahunAnggaranStr += ` (${bulanNama[mIdx].toUpperCase()})`;
    }
  }

  if (filterInfo.dari_tanggal || filterInfo.sampai_tanggal) {
    if (filterInfo.dari_tanggal && filterInfo.sampai_tanggal) {
      tahunAnggaranStr = `${formatDateIndo(filterInfo.dari_tanggal).toUpperCase()} S/D ${formatDateIndo(filterInfo.sampai_tanggal).toUpperCase()}`;
    } else if (filterInfo.dari_tanggal) {
      tahunAnggaranStr = `MULAI ${formatDateIndo(filterInfo.dari_tanggal).toUpperCase()}`;
    } else if (filterInfo.sampai_tanggal) {
      tahunAnggaranStr = `SAMPAI ${formatDateIndo(filterInfo.sampai_tanggal).toUpperCase()}`;
    }
  }

  // 1. Kop Surat Resmi
  try {
    doc.addImage(LOGO_AISYIYAH_BASE64, 'PNG', 14, 8, 20, 20);
  } catch (err) {
    console.warn('Gagal memuat logo ke PDF:', err);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(pengaturan?.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE', 114, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    pengaturan?.alamat || 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang,',
    114,
    19,
    { align: 'center' }
  );
  doc.text(
    `Provinsi Sulawesi Selatan, Email: ${pengaturan?.email || 'klinikaisyiyahpangkajene@gmail.com'}`,
    114,
    23,
    { align: 'center' }
  );
  doc.text(`Hp. ${pengaturan?.telepon || '0878-3117-7100'}`, 114, 27, { align: 'center' });

  // Divider Lines
  doc.setLineWidth(0.8);
  doc.line(14, 31, 196, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32, 196, 32);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LAPORAN INVENTARIS DAN PENGELUARAN OPERASIONAL', 105, 38, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text(`TAHUN ANGGARAN ${tahunAnggaranStr}`, 105, 43, { align: 'center' });

  // 2. Table Rows
  const tableRows: any[] = [];
  const groups: Record<string, Transaksi[]> = {};
  pengeluaranItems.forEach((item) => {
    const kat = (item.kategori || 'LAIN-LAIN').trim().toUpperCase();
    if (!groups[kat]) groups[kat] = [];
    groups[kat].push(item);
  });

  let grandTotalPengeluaran = 0;

  Object.keys(groups)
    .sort()
    .forEach((kategori) => {
      const items = groups[kategori];
      let subTotal = 0;

      tableRows.push([
        {
          content: `KATEGORI: ${kategori}`,
          colSpan: 6,
          styles: {
            fillColor: [230, 235, 240],
            fontStyle: 'bold',
            textColor: [15, 23, 42],
          },
        },
      ]);

      items.forEach((item, index) => {
        const nominal = Number(item.nominal) || 0;
        subTotal += nominal;
        grandTotalPengeluaran += nominal;

        tableRows.push([
          index + 1,
          item.tanggal,
          item.uraian,
          item.satuan || '-',
          item.metode || 'Tunai',
          formatRupiah(nominal),
        ]);
      });

      // Subtotal Row
      tableRows.push([
        {
          content: `Subtotal ${kategori}:`,
          colSpan: 5,
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fillColor: [248, 250, 252],
            textColor: [30, 41, 59],
          },
        },
        {
          content: formatRupiah(subTotal),
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fillColor: [248, 250, 252],
            textColor: [30, 41, 59],
          },
        },
      ]);
    });

  // Grand Total Row
  tableRows.push([
    {
      content: 'TOTAL KESELURUHAN PENGELUARAN:',
      colSpan: 5,
      styles: {
        halign: 'right',
        fontStyle: 'bold',
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
      },
    },
    {
      content: formatRupiah(grandTotalPengeluaran),
      styles: {
        halign: 'right',
        fontStyle: 'bold',
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
      },
    },
  ]);

  // 3. Render AutoTable
  autoTable(doc, {
    startY: 48,
    head: [['No', 'Tanggal', 'Jenis Barang / Uraian', 'Satuan', 'Metode', 'Harga / Nominal']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { cellWidth: 68 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 44 },
    },
    margin: { left: 14, right: 14, bottom: 25 },
  });

  // 4. Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  let signY = finalY + 12;

  // New page if near bottom
  if (signY > 240) {
    doc.addPage();
    signY = 25;
  }

  const kota = pengaturan?.kota || 'Pangkajene';
  const now = new Date();
  const dateStr = formatDateIndo(now.toISOString().split('T')[0]);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${kota}, ${dateStr}`, 155, signY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text(pengaturan?.jabatan_kiri || 'Kepala Klinik', 50, signY + 6, { align: 'center' });
  doc.text(pengaturan?.jabatan_kanan || 'Pemegang Barang', 155, signY + 6, { align: 'center' });

  // Names
  doc.setFont('helvetica', 'bold');
  doc.text(pengaturan?.nama_kiri || 'dr. Syah Rizal Syam Pohan', 50, signY + 28, { align: 'center' });
  doc.text(pengaturan?.nama_kanan || 'Hera A.md.Keb', 155, signY + 28, { align: 'center' });

  // Underlines
  doc.setLineWidth(0.3);
  doc.line(25, signY + 29, 75, signY + 29);
  doc.line(130, signY + 29, 180, signY + 29);

  // NIP
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  if (pengaturan?.nip_kiri) {
    doc.text(pengaturan.nip_kiri, 50, signY + 33, { align: 'center' });
  }

  const cleanClinicName = (pengaturan?.nama_klinik || 'Klinik').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Laporan_Inventaris_${cleanClinicName}_${filterInfo.tahun || 'Semua'}.pdf`);
}

