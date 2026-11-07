/**
 * ====================================================================
 * MANAJEMEN TRANSAKSI KAS (PENGELUARAN & PEMASUKAN)
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

    async function fetchTransaksi() {
      try {
        const res = await fetch('/api/transaksi');
        const json = await res.json();
        if (json.success) {
          allTransactions = json.data;
          populateFilterOptions();
          applyFilters();
        } else {
          showToast((json.message || 'Gagal mengambil data') + (json.error ? ': ' + json.error : ''), 'error');
        }
      } catch (err) {
        console.error('Gagal mengambil transaksi:', err);
        showToast('Gagal terhubung ke database server', 'error');
      }
    }

    // Mengisi Opsi Tahun & Kategori pada Filter
    function populateFilterOptions() {
      // Tahun unik dari data
      const tahunSet = new Set();
      const kategoriSet = new Set();
      const currentYear = new Date().getFullYear();
      tahunSet.add(currentYear);

      allTransactions.forEach(item => {
        if (item.tanggal) {
          const yr = item.tanggal.split('-')[0];
          tahunSet.add(parseInt(yr, 10));
        }
        if (item.kategori && item.jenis === 'Pengeluaran') {
          kategoriSet.add(item.kategori.trim().toUpperCase());
        }
      });

      // Filter Tahun
      const filterTahun = document.getElementById('filterTahun');
      const selectedTahun = filterTahun.value;
      const sortedTahun = Array.from(tahunSet).sort((a, b) => b - a);

      let tahunHtml = '<option value="semua">Semua Tahun</option>';
      sortedTahun.forEach(t => {
        tahunHtml += `<option value="${t}" ${selectedTahun === String(t) ? 'selected' : ''}>${t}</option>`;
      });
      filterTahun.innerHTML = tahunHtml;

      // Filter Kategori
      const filterKategori = document.getElementById('filterKategori');
      const selectedKategori = filterKategori.value;
      const sortedKategori = Array.from(kategoriSet).sort();

      let katHtml = '<option value="semua">Semua Kategori</option>';
      sortedKategori.forEach(k => {
        katHtml += `<option value="${k}" ${selectedKategori === k ? 'selected' : ''}>${k}</option>`;
      });
      filterKategori.innerHTML = katHtml;

      // Update datalist di modal
      const datalistKategori = document.getElementById('listKategori');
      if (datalistKategori) {
        const defaultCats = ['ALAT KANTOR', 'ALAT LISTRIK', 'ALAT KEBERSIHAN', 'TAGIHAN RUTIN', 'DANA MASUK'];
        const allCats = Array.from(new Set([...defaultCats, ...sortedKategori]));
        datalistKategori.innerHTML = allCats.map(c => `<option value="${c}">`).join('');
      }
    }

    // ====================================================================
    // FILTER & KALKULASI RINGKASAN
    // ====================================================================

    function resetFilterTanggal() {
      const dari = document.getElementById('filterDariTanggal');
      const sampai = document.getElementById('filterSampaiTanggal');
      if (dari) dari.value = '';
      if (sampai) sampai.value = '';
      applyFilters();
    }

    function applyFilters() {
      const tahun = document.getElementById('filterTahun').value;
      const bulan = document.getElementById('filterBulan').value;
      const kategori = document.getElementById('filterKategori').value;
      const search = document.getElementById('filterSearch').value.toLowerCase().trim();
      const dariTgl = document.getElementById('filterDariTanggal')?.value;
      const sampaiTgl = document.getElementById('filterSampaiTanggal')?.value;

      filteredTransactions = allTransactions.filter(item => {
        const itemDate = item.tanggal || '';
        const parts = itemDate.split('-');
        const itemYear = parts[0];
        const itemMonth = parseInt(parts[1], 10);

        // Jika filter rentang tanggal kustom diisi
        if (dariTgl && itemDate < dariTgl) return false;
        if (sampaiTgl && itemDate > sampaiTgl) return false;

        // Jika rentang tanggal kustom kosong, gunakan filter Tahun & Bulan
        if (!dariTgl && !sampaiTgl) {
          if (tahun !== 'semua' && itemYear !== String(tahun)) return false;
          if (bulan !== 'semua' && itemMonth !== parseInt(bulan, 10)) return false;
        }

        if (kategori !== 'semua' && item.kategori !== kategori) return false;

        if (search !== '') {
          const uraian = (item.uraian || '').toLowerCase();
          const kat = (item.kategori || '').toLowerCase();
          const met = (item.metode || '').toLowerCase();
          if (!uraian.includes(search) && !kat.includes(search) && !met.includes(search)) {
            return false;
          }
        }

        return true;
      });

      // Hitung 3 Ringkasan
      updateSummaryCards();

      // Render Tabel
      renderPengeluaranTable();
      renderPemasukanTable();

      // Update label periode
      updatePeriodeLabel(tahun, bulan, dariTgl, sampaiTgl);
    }

    function updateSummaryCards() {
      let totalPemasukan = 0;
      let totalPengeluaran = 0;

      filteredTransactions.forEach(item => {
        const nominal = parseInt(item.nominal, 10) || 0;
        if (item.jenis === 'Pemasukan') {
          totalPemasukan += nominal;
        } else {
          totalPengeluaran += nominal;
        }
      });

      const sisaSaldo = totalPemasukan - totalPengeluaran;

      document.getElementById('cardTotalPemasukan').innerText = formatRupiah(totalPemasukan);
      document.getElementById('cardTotalPengeluaran').innerText = formatRupiah(totalPengeluaran);
      document.getElementById('cardSisaSaldo').innerText = formatRupiah(sisaSaldo);

      // Update footer info
      document.getElementById('footerGrandTotalPengeluaran').innerText = formatRupiah(totalPengeluaran);
      document.getElementById('footerSisaSaldo').innerText = formatRupiah(sisaSaldo);
      document.getElementById('tfootTotalPemasukan').innerText = formatRupiah(totalPemasukan);
    }

    function updatePeriodeLabel(tahun, bulan, dariTgl, sampaiTgl) {
      const labelPeriode = document.getElementById('labelPeriodeLaporan');
      if (!labelPeriode) return;

      if (dariTgl || sampaiTgl) {
        let rangeStr = 'Periode: ';
        if (dariTgl && sampaiTgl) {
          rangeStr += `${formatTanggalIndo(dariTgl)} s/d ${formatTanggalIndo(sampaiTgl)}`;
        } else if (dariTgl) {
          rangeStr += `Mulai ${formatTanggalIndo(dariTgl)}`;
        } else {
          rangeStr += `Sampai ${formatTanggalIndo(sampaiTgl)}`;
        }
        labelPeriode.innerText = rangeStr;
        return;
      }

      const bulanNama = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      let txt = 'Tahun Anggaran: ';
      if (tahun === 'semua') {
        txt += 'Semua Periode';
      } else {
        txt += tahun;
      }
      if (bulan !== 'semua') {
        txt += ` (Bulan ${bulanNama[parseInt(bulan, 10)]})`;
      }
      labelPeriode.innerText = txt;
    }

    // ====================================================================
    // RENDER TABEL UTAMA (GROUPING PER KATEGORI + SUB TOTAL + GRAND TOTAL)
    // ====================================================================

    function renderPengeluaranTable() {
      const tbody = document.getElementById('tbodyPengeluaran');
      const pengeluaranItems = filteredTransactions.filter(i => i.jenis === 'Pengeluaran');

      document.getElementById('badgeJumlahItemPengeluaran').innerText = `${pengeluaranItems.length} Item Terdata`;

      if (pengeluaranItems.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-12 text-center text-slate-400">
              <i class="fa-regular fa-folder-open text-3xl mb-2 text-slate-300"></i>
              <p class="font-medium text-slate-600">Tidak ada data transaksi pengeluaran</p>
              <p class="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau tambahkan transaksi baru</p>
            </td>
          </tr>
        `;
        return;
      }

      // Grouping per Kategori
      const groups = {};
      pengeluaranItems.forEach(item => {
        const kat = (item.kategori || 'LAIN-LAIN').trim().toUpperCase();
        if (!groups[kat]) {
          groups[kat] = [];
        }
        groups[kat].push(item);
      });

      let html = '';
      let grandTotal = 0;

      // Iterasi setiap kategori
      Object.keys(groups).sort().forEach(kategori => {
        const items = groups[kategori];
        let subTotal = 0;

        // Baris Sub-Header Kategori (Tebal & Menonjol)
        html += `
          <tr class="bg-slate-100/90 border-t-2 border-b border-slate-300">
            <td colspan="7" class="py-2.5 px-4 font-bold text-slate-800 tracking-wide text-xs uppercase flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>Kategori: ${kategori}</span>
              <span class="text-[11px] font-normal text-slate-500 lowercase">(${items.length} item)</span>
            </td>
          </tr>
        `;

        // Baris Item dalam Kategori (Nomor urut di-reset 1, 2, 3...)
        items.forEach((item, index) => {
          const nominal = parseInt(item.nominal, 10) || 0;
          subTotal += nominal;
          grandTotal += nominal;

          const isEven = index % 2 === 0;
          const bgClass = isEven ? 'bg-white' : 'bg-slate-50/50';

          html += `
            <tr class="${bgClass} hover:bg-emerald-50/40 transition-colors border-b border-slate-100">
              <td class="py-2.5 px-4 text-center font-medium text-slate-600 text-xs">${index + 1}</td>
              <td class="py-2.5 px-4 text-slate-700 whitespace-nowrap text-xs font-mono">${formatTanggalIndo(item.tanggal)}</td>
              <td class="py-2.5 px-4 text-slate-900 font-medium">
                ${escapeHtml(item.uraian)}
              </td>
              <td class="py-2.5 px-4 text-center text-slate-600 text-xs">${escapeHtml(item.satuan || '-')}</td>
              <td class="py-2.5 px-4 text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${item.metode === 'Transfer' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }">
                  ${item.metode}
                </span>
              </td>
              <td class="py-2.5 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                ${formatRupiah(nominal)}
              </td>
              <td class="py-2.5 px-4 text-center whitespace-nowrap">
                <div class="inline-flex items-center gap-1.5">
                  <button onclick="editTransaksi(${item.id})" title="Edit" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button onclick="hapusTransaksi(${item.id})" title="Hapus" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        });

        // Baris Sub-Total "Jumlah" Khusus Kategori Ini
        html += `
          <tr class="bg-emerald-50/60 font-bold border-b-2 border-emerald-200 text-slate-900">
            <td colspan="5" class="py-2.5 px-4 text-right uppercase tracking-wider text-xs text-emerald-900">
              Jumlah (${kategori}) :
            </td>
            <td class="py-2.5 px-4 text-right text-emerald-800 font-bold whitespace-nowrap">
              ${formatRupiah(subTotal)}
            </td>
            <td></td>
          </tr>
        `;
      });

      // Baris "JUMLAH TOTAL" di Paling Bawah Setelah Seluruh Kategori Selesai
      html += `
        <tr class="bg-slate-800 text-white font-extrabold text-sm border-t-4 border-slate-900 shadow-inner">
          <td colspan="5" class="py-4 px-6 text-right uppercase tracking-wider">
            JUMLAH TOTAL :
          </td>
          <td class="py-4 px-4 text-right text-base text-white font-extrabold whitespace-nowrap">
            ${formatRupiah(grandTotal)}
          </td>
          <td></td>
        </tr>
      `;

      tbody.innerHTML = html;
    }

    // ====================================================================
    // RENDER TABEL PEMASUKAN / DANA MASUK
    // ====================================================================

    function renderPemasukanTable() {
      const tbody = document.getElementById('tbodyPemasukan');
      const pemasukanItems = filteredTransactions.filter(i => i.jenis === 'Pemasukan');

      if (pemasukanItems.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-12 text-center text-slate-400">
              <i class="fa-solid fa-hand-holding-dollar text-3xl mb-2 text-slate-300"></i>
              <p class="font-medium text-slate-600">Belum ada riwayat dana masuk pada periode ini</p>
              <button onclick="openModalTambahPemasukan()" class="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                + Catat Dana Masuk
              </button>
            </td>
          </tr>
        `;
        return;
      }

      let html = '';
      pemasukanItems.forEach((item, index) => {
        const nominal = parseInt(item.nominal, 10) || 0;
        const isEven = index % 2 === 0;
        const bgClass = isEven ? 'bg-white' : 'bg-slate-50/50';

        html += `
          <tr class="${bgClass} hover:bg-emerald-50/30 transition-colors">
            <td class="py-3 px-4 text-center font-medium text-slate-600 text-xs">${index + 1}</td>
            <td class="py-3 px-4 text-slate-700 whitespace-nowrap text-xs font-mono">${formatTanggalIndo(item.tanggal)}</td>
            <td class="py-3 px-4 text-slate-900 font-semibold">${escapeHtml(item.uraian)}</td>
            <td class="py-3 px-4 text-slate-600 text-xs uppercase">${escapeHtml(item.kategori || 'DANA MASUK')}</td>
            <td class="py-3 px-4 text-center">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${item.metode === 'Transfer' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }">
                ${item.metode}
              </span>
            </td>
            <td class="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
              ${formatRupiah(nominal)}
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">
              <div class="inline-flex items-center gap-1.5">
                <button onclick="editTransaksi(${item.id})" title="Edit" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 flex items-center justify-center transition-colors">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="hapusTransaksi(${item.id})" title="Hapus" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center transition-colors">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    }


    function openModalTambah() {
      document.getElementById('transaksiId').value = '';
      document.getElementById('formTransaksi').reset();

      // Default tanggal hari ini
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('inputTanggal').value = today;

      // Default jenis Pengeluaran
      document.querySelector('input[name="inputJenis"][value="Pengeluaran"]').checked = true;
      onJenisChange();

      document.getElementById('modalTransaksiTitle').innerText = 'Tambah Transaksi Baru';
      document.getElementById('btnSubmitTransaksi').innerText = 'Simpan Transaksi';
      document.getElementById('nominalPreview').innerText = 'Rp 0';

      const modal = document.getElementById('modalTransaksi');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function openModalTambahPemasukan() {
      openModalTambah();
      document.querySelector('input[name="inputJenis"][value="Pemasukan"]').checked = true;
      document.getElementById('inputKategori').value = 'DANA MASUK';
      document.getElementById('inputSatuan').value = '-';
      onJenisChange();
    }

    function closeModalTransaksi() {
      const modal = document.getElementById('modalTransaksi');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function onJenisChange() {
      const selectedJenis = document.querySelector('input[name="inputJenis"]:checked').value;
      const modalIconContainer = document.getElementById('modalIconContainer');
      const inputSatuan = document.getElementById('inputSatuan');
      const inputKategori = document.getElementById('inputKategori');

      if (selectedJenis === 'Pemasukan') {
        modalIconContainer.className = 'w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold';
        if (!inputKategori.value || inputKategori.value === 'ALAT KANTOR') {
          inputKategori.value = 'DANA MASUK';
        }
        if (!inputSatuan.value) {
          inputSatuan.value = '-';
        }
      } else {
        modalIconContainer.className = 'w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold';
        if (inputKategori.value === 'DANA MASUK') {
          inputKategori.value = 'ALAT KANTOR';
        }
      }
    }

    // Real-time preview format Rupiah di form
    document.getElementById('inputNominal').addEventListener('input', function (e) {
      const val = parseInt(e.target.value, 10);
      document.getElementById('nominalPreview').innerText = val ? formatRupiah(val) : 'Rp 0';
    });

    // Simpan Transaksi (POST atau PUT)
    async function submitFormTransaksi(e) {
      e.preventDefault();

      const id = document.getElementById('transaksiId').value;
      const tanggal = document.getElementById('inputTanggal').value;
      const jenis = document.querySelector('input[name="inputJenis"]:checked').value;
      const kategori = document.getElementById('inputKategori').value.trim().toUpperCase();
      const uraian = document.getElementById('inputUraian').value.trim();
      const satuan = document.getElementById('inputSatuan').value.trim() || '-';
      const nominal = parseInt(document.getElementById('inputNominal').value, 10) || 0;
      const metode = document.getElementById('inputMetode').value;

      if (!tanggal || !kategori || !uraian || nominal <= 0) {
        showToast('Lengkapi tanggal, kategori, uraian, dan nominal yang valid', 'error');
        return;
      }

      const payload = { tanggal, jenis, kategori, uraian, satuan, nominal, metode };

      try {
        let res;
        if (id) {
          // Mode Edit (PUT)
          res = await fetch(`/api/transaksi/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          // Mode Tambah (POST)
          res = await fetch('/api/transaksi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        const json = await res.json();
        if (json.success) {
          showToast(id ? 'Transaksi berhasil diperbarui' : 'Transaksi baru berhasil disimpan');
          closeModalTransaksi();
          await fetchTransaksi();
        } else {
          showToast((json.message || 'Gagal menyimpan transaksi') + (json.error ? ': ' + json.error : ''), 'error');
        }
      } catch (err) {
        console.error('Error simpan transaksi:', err);
        showToast('Terjadi kesalahan jaringan', 'error');
      }
    }

    // Edit Transaksi (Load data ke Form)
    function editTransaksi(id) {
      const item = allTransactions.find(t => t.id === id);
      if (!item) return;

      document.getElementById('transaksiId').value = item.id;
      document.getElementById('inputTanggal').value = item.tanggal;

      const radioJenis = document.querySelector(`input[name="inputJenis"][value="${item.jenis}"]`);
      if (radioJenis) radioJenis.checked = true;
      onJenisChange();

      document.getElementById('inputKategori').value = item.kategori;
      document.getElementById('inputUraian').value = item.uraian;
      document.getElementById('inputSatuan').value = item.satuan || '-';
      document.getElementById('inputNominal').value = item.nominal;
      document.getElementById('nominalPreview').innerText = formatRupiah(item.nominal);
      document.getElementById('inputMetode').value = item.metode || 'Tunai';

      document.getElementById('modalTransaksiTitle').innerText = `Edit Transaksi #${item.id}`;
      document.getElementById('btnSubmitTransaksi').innerText = 'Perbarui Transaksi';

      const modal = document.getElementById('modalTransaksi');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    // Hapus Transaksi (DELETE)
    async function hapusTransaksi(id) {
      const item = allTransactions.find(t => t.id === id);
      const nama = item ? item.uraian : 'transaksi ini';

      if (!confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) {
        return;
      }

      try {
        const res = await fetch(`/api/transaksi/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          showToast('Data transaksi berhasil dihapus');
          await fetchTransaksi();
        } else {
          showToast(json.message || 'Gagal menghapus transaksi', 'error');
        }
      } catch (err) {
        console.error('Error hapus transaksi:', err);
        showToast('Gagal menghapus transaksi', 'error');
      }
    }

    // ====================================================================
    // MODAL PENGATURAN KLINIK
    // ====================================================================