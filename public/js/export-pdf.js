/**
 * ====================================================================
 * MODUL EKSPOR LAPORAN KE PDF RESMI KLINIK
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

    function exportToPDF() {
      if (typeof window.jspdf === 'undefined') {
        showToast('Pustaka jsPDF belum termuat', 'error');
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4'); // A4 Portrait

      const tahun = document.getElementById('filterTahun').value;
      const bulan = document.getElementById('filterBulan').value;
      const pengeluaranItems = filteredTransactions.filter(i => i.jenis === 'Pengeluaran');

      const bulanNama = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const dariTgl = document.getElementById('filterDariTanggal')?.value;
      const sampaiTgl = document.getElementById('filterSampaiTanggal')?.value;
      let tahunAnggaranStr = tahun === 'semua' ? 'SEMUA TAHUN' : tahun;
      if (bulan !== 'semua') {
        tahunAnggaranStr += ` (${bulanNama[parseInt(bulan, 10)].toUpperCase()})`;
      }
      if (dariTgl || sampaiTgl) {
        if (dariTgl && sampaiTgl) tahunAnggaranStr = `${formatTanggalIndo(dariTgl).toUpperCase()} S/D ${formatTanggalIndo(sampaiTgl).toUpperCase()}`;
        else if (dariTgl) tahunAnggaranStr = `MULAI ${formatTanggalIndo(dariTgl).toUpperCase()}`;
        else tahunAnggaranStr = `SAMPAI ${formatTanggalIndo(sampaiTgl).toUpperCase()}`;
      }

      // 1. KOP SURAT RESMI (Persis Sesuai Kop Surat Klinik Aisyiyah Pangkajene)
      try {
        // Logo resmi Klinik Pratama Aisyiyah di kiri atas
        doc.addImage(LOGO_AISYIYAH_BASE64, 'PNG', 14, 8, 20, 20);
      } catch (err) {
        console.warn('Gagal memuat logo ke PDF:', err);
      }

      // Teks Kop Tengah
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(clinicSettings.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE', 114, 14, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(clinicSettings.alamat || 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang,', 114, 19, { align: 'center' });
      doc.text(`Provinsi Sulawesi Selatan, Email: ${clinicSettings.email || 'klinikaisyiyahpangkajene@gmail.com'}`, 114, 23, { align: 'center' });
      doc.text(`Hp. ${clinicSettings.telepon || '0878-3117-7100'}`, 114, 27, { align: 'center' });

      // Garis Ganda Pembatas Kop Surat
      doc.setLineWidth(0.8);
      doc.line(14, 31, 196, 31);
      doc.setLineWidth(0.2);
      doc.line(14, 32, 196, 32);

      // Judul Laporan & Periode
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('LAPORAN INVENTARIS DAN PENGELUARAN OPERASIONAL', 105, 38, { align: 'center' });
      doc.setFontSize(9.5);
      doc.text(`TAHUN ANGGARAN ${tahunAnggaranStr}`, 105, 43, { align: 'center' });

      // 2. SIAPKAN DATA TABEL AUTOTABLE DENGAN GROUPING KATEGORI
      const tableRows = [];
      const groups = {};
      pengeluaranItems.forEach(item => {
        const kat = (item.kategori || 'LAIN-LAIN').trim().toUpperCase();
        if (!groups[kat]) groups[kat] = [];
        groups[kat].push(item);
      });

      let grandTotalPengeluaran = 0;

      Object.keys(groups).sort().forEach(kategori => {
        const items = groups[kategori];
        let subTotal = 0;

        // Row Sub-Header Kategori (Spanning col 1-6)
        tableRows.push([
          {
            content: `KATEGORI: ${kategori}`,
            colSpan: 6,
            styles: {
              fillColor: [230, 235, 240],
              fontStyle: 'bold',
              textColor: [15, 23, 42]
            }
          }
        ]);

        // Item Rows dengan No 1, 2, 3...
        items.forEach((item, index) => {
          const nominal = parseInt(item.nominal, 10) || 0;
          subTotal += nominal;
          grandTotalPengeluaran += nominal;

          tableRows.push([
            { content: String(index + 1), styles: { halign: 'center' } },
            { content: formatTanggalIndo(item.tanggal) },
            { content: item.uraian },
            { content: item.satuan || '-', styles: { halign: 'center' } },
            { content: item.metode, styles: { halign: 'center' } },
            { content: formatRupiah(nominal), styles: { halign: 'right' } }
          ]);
        });

        // Row Sub-Total "Jumlah"
        tableRows.push([
          {
            content: `Jumlah (${kategori})`,
            colSpan: 5,
            styles: {
              halign: 'right',
              fontStyle: 'bold',
              fillColor: [245, 247, 250]
            }
          },
          {
            content: formatRupiah(subTotal),
            styles: {
              halign: 'right',
              fontStyle: 'bold',
              fillColor: [245, 247, 250]
            }
          }
        ]);
      });

      // Row JUMLAH TOTAL
      tableRows.push([
        {
          content: 'JUMLAH TOTAL',
          colSpan: 5,
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fillColor: [220, 225, 230],
            textColor: [0, 0, 0]
          }
        },
        {
          content: formatRupiah(grandTotalPengeluaran),
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fillColor: [220, 225, 230],
            textColor: [0, 0, 0]
          }
        }
      ]);

      // Cetak AutoTable
      doc.autoTable({
        startY: 47,
        head: [['No', 'Tanggal', 'Jenis Barang / Uraian', 'Satuan', 'Metode', 'Harga / Nominal (Rp)']],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [180, 180, 180],
          lineWidth: 0.1,
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [30, 41, 59], // Slate 800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 34, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      // 3. REKAP SALDO KAS & BLOK TANDA TANGAN DI BAWAH TABEL
      let finalY = doc.lastAutoTable.finalY + 8;
      const pageHeight = doc.internal.pageSize.height;

      // Cek apakah muat di halaman yang sama, jika tidak tambah halaman baru
      if (finalY + 55 > pageHeight) {
        doc.addPage();
        finalY = 20;
      }

      // Hitung Rekap Saldo
      let totalPemasukan = 0;
      filteredTransactions.forEach(item => {
        if (item.jenis === 'Pemasukan') totalPemasukan += (parseInt(item.nominal, 10) || 0);
      });
      const sisaSaldo = totalPemasukan - grandTotalPengeluaran;

      // Kotak Rekap Saldo Ringkas
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalY, 182, 18, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Pemasukan Kas : ${formatRupiah(totalPemasukan)}`, 20, finalY + 7);
      doc.text(`Jumlah Total Pengeluaran : ${formatRupiah(grandTotalPengeluaran)}`, 20, finalY + 13);
      doc.setFont('helvetica', 'bold');
      doc.text(`Sisa Saldo Kas Klinik : ${formatRupiah(sisaSaldo)}`, 120, finalY + 10);

      // Tanda Tangan Kiri & Kanan
      const signY = finalY + 26;
      const todayIndo = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // Penandatangan Kiri (Kepala Klinik)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Mengetahui,', 22, signY);
      doc.text(clinicSettings.jabatan_kiri || 'Kepala Klinik', 22, signY + 4.5);
      doc.setFont('helvetica', 'bold');
      const namaKiriTxt = clinicSettings.nama_kiri || 'dr. Syah Rizal Syam Pohan';
      doc.text(namaKiriTxt, 22, signY + 22);
      // Garis bawah nama
      const wKiri = doc.getTextWidth(namaKiriTxt);
      doc.setLineWidth(0.3);
      doc.line(22, signY + 22.8, 22 + wKiri, signY + 22.8);
      if (clinicSettings.nip_kiri) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(clinicSettings.nip_kiri, 22, signY + 27);
      }

      // Penandatangan Kanan (Pemegang Barang)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${clinicSettings.kota || 'Pangkajene'}, ${todayIndo}`, 128, signY);
      doc.text(clinicSettings.jabatan_kanan || 'Pemegang Barang', 128, signY + 4.5);
      doc.setFont('helvetica', 'bold');
      const namaKananTxt = clinicSettings.nama_kanan || 'Hera A.md.Keb';
      doc.text(namaKananTxt, 128, signY + 22);
      // Garis bawah nama
      const wKanan = doc.getTextWidth(namaKananTxt);
      doc.setLineWidth(0.3);
      doc.line(128, signY + 22.8, 128 + wKanan, signY + 22.8);

      const fileName = `Laporan_Inventaris_${clinicSettings.nama_klinik.replace(/[^a-zA-Z0-9]/g, '_')}_${tahun}.pdf`;
      doc.save(fileName);
      showToast('Laporan PDF resmi berhasil diunduh');
    }
