/**
 * ====================================================================
 * MODUL EKSPOR LAPORAN KE EXCEL (.XLSX) RESMI
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

    async function exportToExcel() {
      const tahun = document.getElementById('filterTahun').value;
      const bulan = document.getElementById('filterBulan').value;
      const pengeluaranItems = filteredTransactions.filter(i => i.jenis === 'Pengeluaran');

      const bulanNama = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      let periodeTxt = tahun === 'semua' ? 'SEMUA PERIODE' : `TAHUN ANGGARAN ${tahun}`;
      if (bulan !== 'semua') {
        periodeTxt += ` (BULAN ${bulanNama[parseInt(bulan, 10)].toUpperCase()})`;
      }
      const dariTgl = document.getElementById('filterDariTanggal')?.value;
      const sampaiTgl = document.getElementById('filterSampaiTanggal')?.value;
      if (dariTgl || sampaiTgl) {
        if (dariTgl && sampaiTgl) periodeTxt = `PERIODE ${formatTanggalIndo(dariTgl).toUpperCase()} S/D ${formatTanggalIndo(sampaiTgl).toUpperCase()}`;
        else if (dariTgl) periodeTxt = `PERIODE MULAI ${formatTanggalIndo(dariTgl).toUpperCase()}`;
        else periodeTxt = `PERIODE SAMPAI ${formatTanggalIndo(sampaiTgl).toUpperCase()}`;
      }

      const cleanClinicName = (clinicSettings.nama_klinik || 'Klinik').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Laporan_Inventaris_${cleanClinicName}_${tahun}.xlsx`;

      // Jika pustaka ExcelJS tersedia, buat file Excel dengan LOGO ASLI tersemat di worksheet!
      if (typeof ExcelJS !== 'undefined') {
        try {
          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet('Laporan Inventaris', {
            views: [{ showGridLines: true }]
          });

          // Sematkan Logo Resmi Aisyiyah ke dalam Excel
          try {
            const logoId = wb.addImage({
              base64: LOGO_AISYIYAH_BASE64,
              extension: 'png'
            });
            ws.addImage(logoId, {
              tl: { col: 0.15, row: 0.15 },
              ext: { width: 56, height: 56 }
            });
          } catch (imgErr) {
            console.warn('Gagal menyematkan gambar ke ExcelJS:', imgErr);
          }

          // Tinggi Baris Kop
          ws.getRow(1).height = 22;
          ws.getRow(2).height = 16;
          ws.getRow(3).height = 16;
          ws.getRow(4).height = 8;
          ws.getRow(5).height = 20;
          ws.getRow(6).height = 18;
          ws.getRow(7).height = 10;

          // Kop Teks (Kolom B-F)
          ws.mergeCells('B1:F1');
          const cellNama = ws.getCell('B1');
          cellNama.value = (clinicSettings.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE').toUpperCase();
          cellNama.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
          cellNama.alignment = { horizontal: 'center', vertical: 'middle' };

          ws.mergeCells('B2:F2');
          const cellAlamat = ws.getCell('B2');
          cellAlamat.value = clinicSettings.alamat || 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan';
          cellAlamat.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
          cellAlamat.alignment = { horizontal: 'center', vertical: 'middle' };

          ws.mergeCells('B3:F3');
          const cellKontak = ws.getCell('B3');
          cellKontak.value = `Email: ${clinicSettings.email || 'klinikaisyiyahpangkajene@gmail.com'}   Hp. ${clinicSettings.telepon || '0878-3117-7100'}`;
          cellKontak.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
          cellKontak.alignment = { horizontal: 'center', vertical: 'middle' };

          // Garis Pemisah Kop (Row 4)
          ws.mergeCells('A4:F4');
          const sepCell = ws.getCell('A4');
          sepCell.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };

          // Judul Laporan (Row 5 & 6)
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

          // Lebar Kolom
          ws.columns = [
            { key: 'no', width: 6 },
            { key: 'tgl', width: 16 },
            { key: 'uraian', width: 44 },
            { key: 'satuan', width: 12 },
            { key: 'metode', width: 14 },
            { key: 'nominal', width: 24 }
          ];

          // 3. Header Kolom Tabel (Row 8)
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
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
          });
          r++;

          // 4. Data Grouping Kategori
          const groups = {};
          pengeluaranItems.forEach(item => {
            const kat = (item.kategori || 'LAIN-LAIN').trim().toUpperCase();
            if (!groups[kat]) groups[kat] = [];
            groups[kat].push(item);
          });

          let grandTotal = 0;
          const borderThin = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };

          Object.keys(groups).sort().forEach(kat => {
            const items = groups[kat];
            let subTotal = 0;

            // Sub-header Kategori
            ws.mergeCells(`A${r}:F${r}`);
            const catCell = ws.getCell(`A${r}`);
            catCell.value = `  KATEGORI: ${kat}`;
            catCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
            catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
            catCell.alignment = { horizontal: 'left', vertical: 'middle' };
            for (let c = 1; c <= 6; c++) ws.getRow(r).getCell(c).border = borderThin;
            ws.getRow(r).height = 22;
            r++;

            // Items
            items.forEach((item, idx) => {
              const nom = parseInt(item.nominal, 10) || 0;
              subTotal += nom;
              grandTotal += nom;

              const itemRow = ws.getRow(r);
              itemRow.height = 20;
              const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

              const c1 = itemRow.getCell(1); c1.value = idx + 1; c1.alignment = { horizontal: 'center', vertical: 'middle' };
              const c2 = itemRow.getCell(2); c2.value = item.tanggal; c2.alignment = { horizontal: 'center', vertical: 'middle' };
              const c3 = itemRow.getCell(3); c3.value = item.uraian; c3.alignment = { horizontal: 'left', vertical: 'middle' };
              const c4 = itemRow.getCell(4); c4.value = item.satuan || '-'; c4.alignment = { horizontal: 'center', vertical: 'middle' };
              const c5 = itemRow.getCell(5); c5.value = item.metode; c5.alignment = { horizontal: 'center', vertical: 'middle' };
              const c6 = itemRow.getCell(6); c6.value = nom; c6.numFmt = '"Rp" #,##0'; c6.font = { name: 'Calibri', size: 9, bold: true }; c6.alignment = { horizontal: 'right', vertical: 'middle' };

              for (let c = 1; c <= 6; c++) {
                const cell = itemRow.getCell(c);
                cell.font = Object.assign({ name: 'Calibri', size: 9 }, cell.font || {});
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                cell.border = borderThin;
              }
              r++;
            });

            // Sub-Total Kategori
            ws.mergeCells(`A${r}:E${r}`);
            const subLabel = ws.getCell(`A${r}`);
            subLabel.value = `Jumlah (${kat}) :`;
            subLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
            subLabel.alignment = { horizontal: 'right', vertical: 'middle' };

            const subVal = ws.getCell(`F${r}`);
            subVal.value = subTotal;
            subVal.numFmt = '"Rp" #,##0';
            subVal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
            subVal.alignment = { horizontal: 'right', vertical: 'middle' };

            for (let c = 1; c <= 6; c++) {
              const cell = ws.getRow(r).getCell(c);
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
              cell.border = borderThin;
            }
            ws.getRow(r).height = 22;
            r++;
          });

          // Grand Total
          ws.mergeCells(`A${r}:E${r}`);
          const gtLabel = ws.getCell(`A${r}`);
          gtLabel.value = 'JUMLAH TOTAL PENGELUARAN & INVENTARIS :';
          gtLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          gtLabel.alignment = { horizontal: 'right', vertical: 'middle' };

          const gtVal = ws.getCell(`F${r}`);
          gtVal.value = grandTotal;
          gtVal.numFmt = '"Rp" #,##0';
          gtVal.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          gtVal.alignment = { horizontal: 'right', vertical: 'middle' };

          for (let c = 1; c <= 6; c++) {
            const cell = ws.getRow(r).getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.border = {
              top: { style: 'medium', color: { argb: 'FF0F172A' } },
              bottom: { style: 'double', color: { argb: 'FF0F172A' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
          }
          ws.getRow(r).height = 26;
          r += 2;

          // 5. Rekapitulasi Kas & Saldo
          let totalPemasukan = 0;
          filteredTransactions.forEach(item => {
            if (item.jenis === 'Pemasukan') totalPemasukan += (parseInt(item.nominal, 10) || 0);
          });
          const sisaSaldo = totalPemasukan - grandTotal;

          ws.mergeCells(`B${r}:F${r}`);
          const rkHeader = ws.getCell(`B${r}`);
          rkHeader.value = 'REKAPITULASI KAS & OPERASIONAL';
          rkHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
          rkHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          rkHeader.alignment = { horizontal: 'center', vertical: 'middle' };
          for (let c = 2; c <= 6; c++) ws.getRow(r).getCell(c).border = borderThin;
          ws.getRow(r).height = 22;
          r++;

          // Pemasukan
          ws.mergeCells(`B${r}:E${r}`);
          ws.getCell(`B${r}`).value = 'Total Pemasukan / Dana Kas';
          ws.getCell(`F${r}`).value = totalPemasukan;
          ws.getCell(`F${r}`).numFmt = '"Rp" #,##0';
          ws.getCell(`F${r}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF047857' } };
          ws.getCell(`F${r}`).alignment = { horizontal: 'right', vertical: 'middle' };
          for (let c = 2; c <= 6; c++) ws.getRow(r).getCell(c).border = borderThin;
          ws.getRow(r).height = 20;
          r++;

          // Pengeluaran
          ws.mergeCells(`B${r}:E${r}`);
          ws.getCell(`B${r}`).value = 'Jumlah Total Pengeluaran';
          ws.getCell(`F${r}`).value = grandTotal;
          ws.getCell(`F${r}`).numFmt = '"Rp" #,##0';
          ws.getCell(`F${r}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
          ws.getCell(`F${r}`).alignment = { horizontal: 'right', vertical: 'middle' };
          for (let c = 2; c <= 6; c++) ws.getRow(r).getCell(c).border = borderThin;
          ws.getRow(r).height = 20;
          r++;

          // Sisa Saldo
          ws.mergeCells(`B${r}:E${r}`);
          const salLabel = ws.getCell(`B${r}`);
          salLabel.value = 'Sisa Saldo Kas Klinik';
          salLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1D4ED8' } };
          const salVal = ws.getCell(`F${r}`);
          salVal.value = sisaSaldo;
          salVal.numFmt = '"Rp" #,##0';
          salVal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1D4ED8' } };
          salVal.alignment = { horizontal: 'right', vertical: 'middle' };
          for (let c = 2; c <= 6; c++) {
            const cell = ws.getRow(r).getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
            cell.border = borderThin;
          }
          ws.getRow(r).height = 22;
          r += 2;

          // 6. Blok Tanda Tangan
          const todayIndo = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          ws.mergeCells(`B${r}:C${r}`);
          const signLeft1 = ws.getCell(`B${r}`);
          signLeft1.value = clinicSettings.jabatan_kiri || 'Kepala Klinik';
          signLeft1.font = { name: 'Calibri', size: 9, bold: true };
          signLeft1.alignment = { horizontal: 'center' };

          ws.mergeCells(`E${r}:F${r}`);
          const signRight1 = ws.getCell(`E${r}`);
          signRight1.value = `${clinicSettings.kota || 'Pangkajene'}, ${todayIndo}`;
          signRight1.font = { name: 'Calibri', size: 9 };
          signRight1.alignment = { horizontal: 'center' };
          ws.getRow(r).height = 18;
          r++;

          ws.mergeCells(`E${r}:F${r}`);
          const signRight2 = ws.getCell(`E${r}`);
          signRight2.value = clinicSettings.jabatan_kanan || 'Pemegang Barang';
          signRight2.font = { name: 'Calibri', size: 9, bold: true };
          signRight2.alignment = { horizontal: 'center' };
          ws.getRow(r).height = 18;
          r += 4; // Space for signature

          ws.mergeCells(`B${r}:C${r}`);
          const signLeftName = ws.getCell(`B${r}`);
          signLeftName.value = clinicSettings.nama_kiri || 'dr. Syah Rizal Syam Pohan';
          signLeftName.font = { name: 'Calibri', size: 9, bold: true, underline: true };
          signLeftName.alignment = { horizontal: 'center' };

          ws.mergeCells(`E${r}:F${r}`);
          const signRightName = ws.getCell(`E${r}`);
          signRightName.value = clinicSettings.nama_kanan || 'Hera A.md.Keb';
          signRightName.font = { name: 'Calibri', size: 9, bold: true, underline: true };
          signRightName.alignment = { horizontal: 'center' };
          ws.getRow(r).height = 18;
          r++;

          if (clinicSettings.nip_kiri) {
            ws.mergeCells(`B${r}:C${r}`);
            const signLeftNip = ws.getCell(`B${r}`);
            signLeftNip.value = clinicSettings.nip_kiri;
            signLeftNip.font = { name: 'Calibri', size: 8, color: { argb: 'FF475569' } };
            signLeftNip.alignment = { horizontal: 'center' };
            ws.getRow(r).height = 16;
            r++;
          }

          // Generate file & download
          const buffer = await wb.xlsx.writeBuffer();
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('Laporan Excel resmi berhasil diunduh lengkap dengan Logo');
          return;
        } catch (excelErr) {
          console.error('Error saat membuat Excel dengan ExcelJS:', excelErr);
        }
      }

      // Fallback ke SheetJS / xlsx-js-style jika ExcelJS belum tersedia
      if (typeof XLSX === 'undefined') {
        showToast('Pustaka Excel belum termuat', 'error');
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = {};
      const merges = [];
      const rowHeights = [];

      // Standar Border Tipis
      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      // Header Kolom Style (Navy gelap, teks putih tebal, tengah)
      const tableHeaderStyle = {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E293B' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderThin
      };

      // Helper Set Cell
      function setCell(r, c, v, type = 's', style = {}, numFmt = null) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = { t: type, v: v };
        if (style && Object.keys(style).length > 0) cell.s = style;
        if (numFmt) cell.z = numFmt;
        ws[addr] = cell;
      }

      // Helper Merge Cells & Apply Border
      function mergeCells(r1, c1, r2, c2, style = {}) {
        merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
        if (style && Object.keys(style).length > 0) {
          for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
              const addr = XLSX.utils.encode_cell({ r, c });
              if (!ws[addr]) {
                ws[addr] = { t: 's', v: '', s: style };
              } else {
                ws[addr].s = Object.assign({}, ws[addr].s, style);
              }
            }
          }
        }
      }

      let r = 0;

      // 1. KOP SURAT RESMI EXCEL (Sesuai Kop Surat Klinik Aisyiyah Pangkajene)
      setCell(r, 0, (clinicSettings.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE').toUpperCase(), 's', {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeCells(r, 0, r, 5);
      rowHeights.push({ hpt: 22 });
      r++;

      setCell(r, 0, clinicSettings.alamat || 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan', 's', {
        font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeCells(r, 0, r, 5);
      rowHeights.push({ hpt: 16 });
      r++;

      setCell(r, 0, `Email: ${clinicSettings.email || 'klinikaisyiyahpangkajene@gmail.com'}   Hp. ${clinicSettings.telepon || '0878-3117-7100'}`, 's', {
        font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeCells(r, 0, r, 5);
      rowHeights.push({ hpt: 16 });
      r++;

      // Garis Pemisah Kop
      setCell(r, 0, '', 's', {
        border: { bottom: { style: 'medium', color: { rgb: '0F172A' } } }
      });
      mergeCells(r, 0, r, 5, {
        border: { bottom: { style: 'medium', color: { rgb: '0F172A' } } }
      });
      rowHeights.push({ hpt: 8 });
      r++;

      // Judul Laporan & Periode
      setCell(r, 0, 'LAPORAN INVENTARIS DAN PENGELUARAN OPERASIONAL', 's', {
        font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeCells(r, 0, r, 5);
      rowHeights.push({ hpt: 20 });
      r++;

      setCell(r, 0, `PERIODE : ${periodeTxt}`, 's', {
        font: { name: 'Calibri', sz: 10, bold: true, italic: true, color: { rgb: '047857' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeCells(r, 0, r, 5);
      rowHeights.push({ hpt: 18 });
      r++;

      // Baris Kosong
      rowHeights.push({ hpt: 10 });
      r++;

      // 2. HEADER KOLOM TABEL
      const headers = ['No', 'Tanggal', 'Jenis Barang / Uraian', 'Satuan', 'Metode', 'Harga / Nominal (Rp)'];
      headers.forEach((h, c) => {
        setCell(r, c, h, 's', tableHeaderStyle);
      });
      rowHeights.push({ hpt: 24 });
      r++;

      // 3. GROUPING PER KATEGORI (SUB TOTAL & PENOMORAN ULANG)
      const groups = {};
      pengeluaranItems.forEach(item => {
        const kat = (item.kategori || 'LAIN-LAIN').trim().toUpperCase();
        if (!groups[kat]) groups[kat] = [];
        groups[kat].push(item);
      });

      let grandTotalPengeluaran = 0;

      const categoryKeys = Object.keys(groups).sort();
      if (categoryKeys.length === 0) {
        setCell(r, 0, 'Tidak ada data pengeluaran pada periode ini', 's', {
          font: { italic: true, sz: 10, color: { rgb: '94A3B8' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        mergeCells(r, 0, r, 5, { border: borderThin });
        rowHeights.push({ hpt: 24 });
        r++;
      } else {
        categoryKeys.forEach(kategori => {
          const items = groups[kategori];
          let subTotal = 0;

          // Sub-header Kategori (Warna soft slate, teks tebal, merged A-F)
          const catStyle = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: borderThin
          };
          setCell(r, 0, `  KATEGORI: ${kategori}`, 's', catStyle);
          mergeCells(r, 0, r, 5, catStyle);
          rowHeights.push({ hpt: 22 });
          r++;

          // Baris Item dalam Kategori (Nomor reset 1, 2, 3...)
          items.forEach((item, index) => {
            const nominal = parseInt(item.nominal, 10) || 0;
            subTotal += nominal;
            grandTotalPengeluaran += nominal;

            const isEven = index % 2 === 0;
            const bgHex = isEven ? 'FFFFFF' : 'F8FAFC';
            const itemStyle = {
              font: { name: 'Calibri', sz: 9 },
              fill: { fgColor: { rgb: bgHex } },
              border: borderThin
            };

            // No
            setCell(r, 0, index + 1, 'n', { ...itemStyle, alignment: { horizontal: 'center', vertical: 'center' } });
            // Tanggal
            setCell(r, 1, item.tanggal, 's', { ...itemStyle, alignment: { horizontal: 'center', vertical: 'center' } });
            // Uraian
            setCell(r, 2, item.uraian, 's', { ...itemStyle, alignment: { horizontal: 'left', vertical: 'center' } });
            // Satuan
            setCell(r, 3, item.satuan || '-', 's', { ...itemStyle, alignment: { horizontal: 'center', vertical: 'center' } });
            // Metode
            setCell(r, 4, item.metode, 's', { ...itemStyle, alignment: { horizontal: 'center', vertical: 'center' } });
            // Nominal (Format Angka Rupiah Resmi)
            setCell(r, 5, nominal, 'n', {
              ...itemStyle,
              font: { name: 'Calibri', sz: 9, bold: true },
              alignment: { horizontal: 'right', vertical: 'center' }
            }, '"Rp" #,##0');

            rowHeights.push({ hpt: 20 });
            r++;
          });

          // Baris Sub-Total Kategori (Merged A-E, Soft Green, Teks Hijau Tua Tebal)
          const subtotalStyle = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '065F46' } },
            fill: { fgColor: { rgb: 'ECFDF5' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderThin
          };
          setCell(r, 0, `Jumlah (${kategori}) :`, 's', subtotalStyle);
          mergeCells(r, 0, r, 4, subtotalStyle);
          setCell(r, 5, subTotal, 'n', {
            ...subtotalStyle,
            alignment: { horizontal: 'right', vertical: 'center' }
          }, '"Rp" #,##0');
          rowHeights.push({ hpt: 22 });
          r++;
        });

        // Baris JUMLAH TOTAL (Navy gelap, teks putih tebal, merged A-E, F nominal)
        const grandTotalStyle = {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1E293B' } },
          alignment: { horizontal: 'right', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } }
          }
        };
        setCell(r, 0, 'JUMLAH TOTAL PENGELUARAN & INVENTARIS :', 's', grandTotalStyle);
        mergeCells(r, 0, r, 4, grandTotalStyle);
        setCell(r, 5, grandTotalPengeluaran, 'n', {
          ...grandTotalStyle,
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'right', vertical: 'center' }
        }, '"Rp" #,##0');
        rowHeights.push({ hpt: 26 });
        r++;
      }

      // Baris Kosong
      rowHeights.push({ hpt: 14 });
      r++;

      // 4. REKAPITULASI KAS & OPERASIONAL (TABEL BOX RAPI)
      let totalPemasukan = 0;
      filteredTransactions.forEach(item => {
        if (item.jenis === 'Pemasukan') totalPemasukan += (parseInt(item.nominal, 10) || 0);
      });
      const sisaSaldo = totalPemasukan - grandTotalPengeluaran;

      // Header Rekap
      const rekapHeaderStyle = {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      };
      setCell(r, 1, 'REKAPITULASI KAS & OPERASIONAL', 's', rekapHeaderStyle);
      mergeCells(r, 1, r, 5, rekapHeaderStyle);
      rowHeights.push({ hpt: 22 });
      r++;

      // Pemasukan
      setCell(r, 1, 'Total Pemasukan / Dana Kas', 's', { font: { sz: 9, bold: false }, border: borderThin, alignment: { horizontal: 'left', vertical: 'center' } });
      mergeCells(r, 1, r, 4, { border: borderThin });
      setCell(r, 5, totalPemasukan, 'n', {
        font: { sz: 9, bold: true, color: { rgb: '047857' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, '"Rp" #,##0');
      rowHeights.push({ hpt: 20 });
      r++;

      // Pengeluaran
      setCell(r, 1, 'Jumlah Total Pengeluaran', 's', { font: { sz: 9, bold: false }, border: borderThin, alignment: { horizontal: 'left', vertical: 'center' } });
      mergeCells(r, 1, r, 4, { border: borderThin });
      setCell(r, 5, grandTotalPengeluaran, 'n', {
        font: { sz: 9, bold: true, color: { rgb: 'B91C1C' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      }, '"Rp" #,##0');
      rowHeights.push({ hpt: 20 });
      r++;

      // Sisa Saldo
      const saldoStyle = {
        font: { sz: 10, bold: true, color: { rgb: '1D4ED8' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        border: borderThin
      };
      setCell(r, 1, 'Sisa Saldo Kas Klinik', 's', { ...saldoStyle, alignment: { horizontal: 'left', vertical: 'center' } });
      mergeCells(r, 1, r, 4, saldoStyle);
      setCell(r, 5, sisaSaldo, 'n', { ...saldoStyle, alignment: { horizontal: 'right', vertical: 'center' } }, '"Rp" #,##0');
      rowHeights.push({ hpt: 22 });
      r++;

      // Baris Kosong
      rowHeights.push({ hpt: 16 });
      r++;

      // 5. BLOK TANDA TANGAN (KIRI: PIMPINAN, KANAN: PEMEGANG BARANG)
      const todayIndo = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // Baris 1: Tanggal & Jabatan
      setCell(r, 1, clinicSettings.jabatan_kiri, 's', { font: { sz: 9, bold: true }, alignment: { horizontal: 'center' } });
      mergeCells(r, 1, r, 2);

      setCell(r, 4, `${clinicSettings.kota}, ${todayIndo}`, 's', { font: { sz: 9 }, alignment: { horizontal: 'center' } });
      mergeCells(r, 4, r, 5);
      rowHeights.push({ hpt: 18 });
      r++;

      setCell(r, 4, clinicSettings.jabatan_kanan, 's', { font: { sz: 9, bold: true }, alignment: { horizontal: 'center' } });
      mergeCells(r, 4, r, 5);
      rowHeights.push({ hpt: 18 });
      r++;

      // Jarak tanda tangan
      rowHeights.push({ hpt: 18 });
      r++;
      rowHeights.push({ hpt: 18 });
      r++;
      rowHeights.push({ hpt: 18 });
      r++;

      // Nama Penandatangan (Tebal & Bergaris Bawah)
      setCell(r, 1, clinicSettings.nama_kiri, 's', { font: { sz: 9, bold: true, underline: true }, alignment: { horizontal: 'center' } });
      mergeCells(r, 1, r, 2);

      setCell(r, 4, clinicSettings.nama_kanan, 's', { font: { sz: 9, bold: true, underline: true }, alignment: { horizontal: 'center' } });
      mergeCells(r, 4, r, 5);
      rowHeights.push({ hpt: 18 });
      r++;

      // NIP (jika ada)
      if (clinicSettings.nip_kiri) {
        setCell(r, 1, clinicSettings.nip_kiri, 's', { font: { sz: 8, color: { rgb: '475569' } }, alignment: { horizontal: 'center' } });
        mergeCells(r, 1, r, 2);
        rowHeights.push({ hpt: 16 });
        r++;
      }

      // Metadata Worksheet: Reference Range, Merges, Column Widths, Row Heights, & Gridlines
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r, c: 5 } });
      ws['!merges'] = merges;
      ws['!rows'] = rowHeights;
      ws['!views'] = [{ showGridLines: true }];
      ws['!cols'] = [
        { wch: 6 },  // A: No
        { wch: 15 }, // B: Tanggal
        { wch: 42 }, // C: Jenis Barang / Uraian
        { wch: 12 }, // D: Satuan
        { wch: 14 }, // E: Metode
        { wch: 24 }  // F: Harga / Nominal (Rp)
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Inventaris');

      XLSX.writeFile(wb, fileName);
      showToast('Laporan Excel resmi berhasil diunduh dengan format rapi');
    }

    // ====================================================================
    // FITUR UNDUH LAPORAN PDF (.PDF) RESMI
    // ====================================================================