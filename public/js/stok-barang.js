/**
 * ====================================================================
 * MANAJEMEN INVENTARIS STOK BARANG KLINIK
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

    async function fetchStokBarang() {
      try {
        const res = await fetch('/api/stok-barang');
        const json = await res.json();
        if (json.success) {
          allStokBarang = json.data || [];
          populateStokFilterOptions();
          applyFiltersStok();
        } else {
          showToast(json.message || 'Gagal memuat stok barang klinik', 'error');
        }
      } catch (err) {
        console.error('Error fetch stok barang:', err);
        showToast('Gagal terhubung ke database server', 'error');
      }
    }

    // Populasi Filter Dropdown Kategori & Ruangan
    function populateStokFilterOptions() {
      const katSet = new Set();
      const ruangSet = new Set();

      allStokBarang.forEach(item => {
        if (item.kategori) katSet.add(item.kategori.trim().toUpperCase());
        if (item.ruangan) ruangSet.add(item.ruangan.trim());
      });

      const filterKat = document.getElementById('filterStokKategori');
      if (filterKat) {
        const cur = filterKat.value;
        let html = '<option value="semua">Semua Kategori</option>';
        Array.from(katSet).sort().forEach(k => {
          html += `<option value="${escapeHtml(k)}" ${cur === k ? 'selected' : ''}>${escapeHtml(k)}</option>`;
        });
        filterKat.innerHTML = html;
      }

      const filterRuang = document.getElementById('filterStokRuangan');
      if (filterRuang) {
        const cur = filterRuang.value;
        let html = '<option value="semua">Semua Ruangan</option>';
        Array.from(ruangSet).sort().forEach(r => {
          html += `<option value="${escapeHtml(r)}" ${cur === r ? 'selected' : ''}>${escapeHtml(r)}</option>`;
        });
        filterRuang.innerHTML = html;
      }
    }

    // Terapkan Filter & Pencarian pada Stok Barang
    function applyFiltersStok() {
      const search = (document.getElementById('filterStokSearch')?.value || '').toLowerCase().trim();
      const kategori = document.getElementById('filterStokKategori')?.value || 'semua';
      const ruangan = document.getElementById('filterStokRuangan')?.value || 'semua';
      const kondisi = document.getElementById('filterStokKondisi')?.value || 'semua';

      filteredStokBarang = allStokBarang.filter(item => {
        if (kategori !== 'semua' && (item.kategori || '').toUpperCase() !== kategori.toUpperCase()) return false;
        if (ruangan !== 'semua' && (item.ruangan || '') !== ruangan) return false;
        if (kondisi !== 'semua' && (item.kondisi || '') !== kondisi) return false;

        if (search !== '') {
          const nama = (item.nama_barang || '').toLowerCase();
          const kode = (item.kode_barang || '').toLowerCase();
          const ket = (item.keterangan || '').toLowerCase();
          const r = (item.ruangan || '').toLowerCase();
          if (!nama.includes(search) && !kode.includes(search) && !ket.includes(search) && !r.includes(search)) {
            return false;
          }
        }
        return true;
      });

      updateStokSummaryCards();
      renderStokTable();
    }

    // Update 4 Mini Stat Card
    function updateStokSummaryCards() {
      const totalRagam = filteredStokBarang.length;
      let totalFisik = 0;
      let kondisiBaik = 0;
      let kondisiRusak = 0;

      filteredStokBarang.forEach(item => {
        const jml = parseInt(item.jumlah, 10) || 0;
        totalFisik += jml;
        if (item.kondisi === 'Baik') {
          kondisiBaik += jml;
        } else {
          kondisiRusak += jml;
        }
      });

      const elRagam = document.getElementById('stokTotalRagam');
      if (elRagam) elRagam.innerText = `${totalRagam} Item`;

      const elFisik = document.getElementById('stokTotalFisik');
      if (elFisik) elFisik.innerText = `${totalFisik} Unit`;

      const elBaik = document.getElementById('stokKondisiBaik');
      if (elBaik) elBaik.innerText = `${kondisiBaik} Unit`;

      const elRusak = document.getElementById('stokKondisiRusak');
      if (elRusak) elRusak.innerText = `${kondisiRusak} Unit`;

      const elLabel = document.getElementById('stokCountLabel');
      if (elLabel) elLabel.innerText = `Menampilkan ${filteredStokBarang.length} dari total ${allStokBarang.length} barang klinik`;
    }

    // Render Tabel Stok Barang
    function renderStokTable() {
      const tbody = document.getElementById('tbodyStokBarang');
      if (!tbody) return;

      if (filteredStokBarang.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="py-12 text-center text-slate-400">
              <i class="fa-solid fa-boxes-stacked text-3xl mb-2 text-indigo-300"></i>
              <p class="font-medium text-slate-600">Belum ada barang pada filter yang dipilih</p>
              <button onclick="openModalTambahStok()" class="mt-3 inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200">
                <i class="fa-solid fa-plus mr-1.5"></i> Tambah Barang Sekarang
              </button>
            </td>
          </tr>
        `;
        return;
      }

      let html = '';
      filteredStokBarang.forEach((item, index) => {
        const isEven = index % 2 === 0;
        const bgClass = isEven ? 'bg-white' : 'bg-slate-50/50';

        // Badge Kondisi
        let badgeKondisi = '';
        if (item.kondisi === 'Baik') {
          badgeKondisi = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-circle-check mr-1 text-[9px]"></i> Baik</span>';
        } else if (item.kondisi === 'Rusak Ringan') {
          badgeKondisi = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-solid fa-triangle-exclamation mr-1 text-[9px]"></i> Rusak Ringan</span>';
        } else {
          badgeKondisi = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-circle-xmark mr-1 text-[9px]"></i> Rusak Berat</span>';
        }

        html += `
          <tr class="${bgClass} hover:bg-indigo-50/40 transition-colors border-b border-slate-100">
            <td class="py-3 px-4 text-center font-medium text-slate-500 text-xs">${index + 1}</td>
            <td class="py-3 px-4 whitespace-nowrap text-xs font-mono font-semibold text-slate-700">
              <span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">${escapeHtml(item.kode_barang || 'BRG-' + item.id)}</span>
            </td>
            <td class="py-3 px-4 text-slate-900 font-bold text-sm">
              ${escapeHtml(item.nama_barang)}
            </td>
            <td class="py-3 px-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                ${escapeHtml(item.kategori || 'UMUM')}
              </span>
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                ${item.jumlah} <span class="font-normal text-[11px] text-slate-500 ml-1">${escapeHtml(item.satuan || 'unit')}</span>
              </span>
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">
              ${badgeKondisi}
            </td>
            <td class="py-3 px-4 text-slate-700 text-xs whitespace-nowrap">
              <span class="inline-flex items-center gap-1 font-medium">
                <i class="fa-solid fa-location-dot text-indigo-500 text-[11px]"></i>
                ${escapeHtml(item.ruangan || 'Poli Umum')}
              </span>
            </td>
            <td class="py-3 px-4 text-slate-600 text-xs">
              ${escapeHtml(item.keterangan || '-')}
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">
              <div class="inline-flex items-center gap-1.5">
                <button onclick="editStok(${item.id})" title="Edit Barang" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 flex items-center justify-center transition-colors">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="hapusStok(${item.id})" title="Hapus Barang" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center transition-colors">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    }

    // Modal Form Stok Handlers
    function openModalTambahStok() {
      document.getElementById('stokId').value = '';
      document.getElementById('formStokBarang').reset();

      const today = new Date().toISOString().split('T')[0];
      document.getElementById('inputTanggalMasuk').value = today;
      document.getElementById('inputKodeBarang').value = 'MED-' + Math.floor(100 + Math.random() * 900);
      document.getElementById('inputJumlahStok').value = 1;
      document.getElementById('inputSatuanStok').value = 'unit';
      document.getElementById('inputKondisiStok').value = 'Baik';
      document.getElementById('inputRuanganStok').value = 'Poli Umum';

      document.getElementById('modalStokTitle').innerText = 'Tambah Barang / Stok Klinik';
      document.getElementById('btnSubmitStok').innerHTML = '<i class="fa-solid fa-check"></i> <span>Simpan ke Stok Klinik</span>';

      const modal = document.getElementById('modalStokBarang');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeModalStok() {
      const modal = document.getElementById('modalStokBarang');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function editStok(id) {
      const item = allStokBarang.find(b => b.id === id);
      if (!item) return;

      document.getElementById('stokId').value = item.id;
      document.getElementById('inputKodeBarang').value = item.kode_barang || '';
      document.getElementById('inputTanggalMasuk').value = item.tanggal_masuk || new Date().toISOString().split('T')[0];
      document.getElementById('inputNamaBarang').value = item.nama_barang || '';
      document.getElementById('inputKategoriStok').value = item.kategori || '';
      document.getElementById('inputRuanganStok').value = item.ruangan || 'Poli Umum';
      document.getElementById('inputJumlahStok').value = item.jumlah || 1;
      document.getElementById('inputSatuanStok').value = item.satuan || 'unit';
      document.getElementById('inputKondisiStok').value = item.kondisi || 'Baik';
      document.getElementById('inputKeteranganStok').value = item.keterangan || '';

      document.getElementById('modalStokTitle').innerText = `Edit Barang: ${item.nama_barang}`;
      document.getElementById('btnSubmitStok').innerHTML = '<i class="fa-solid fa-check"></i> <span>Perbarui Barang</span>';

      const modal = document.getElementById('modalStokBarang');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    async function hapusStok(id) {
      const item = allStokBarang.find(b => b.id === id);
      const nama = item ? item.nama_barang : 'barang ini';

      if (!confirm(`Apakah Anda yakin ingin menghapus "${nama}" dari daftar stok klinik?`)) {
        return;
      }

      try {
        const res = await fetch(`/api/stok-barang/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          showToast('Data stok barang berhasil dihapus');
          await fetchStokBarang();
        } else {
          showToast(json.message || 'Gagal menghapus stok barang', 'error');
        }
      } catch (err) {
        console.error('Error hapus stok barang:', err);
        showToast('Gagal menghapus stok barang', 'error');
      }
    }

    async function submitFormStok(e) {
      e.preventDefault();

      const id = document.getElementById('stokId').value;
      const kode_barang = document.getElementById('inputKodeBarang').value.trim();
      const tanggal_masuk = document.getElementById('inputTanggalMasuk').value;
      const nama_barang = document.getElementById('inputNamaBarang').value.trim();
      const kategori = document.getElementById('inputKategoriStok').value.trim().toUpperCase();
      const ruangan = document.getElementById('inputRuanganStok').value.trim();
      const jumlah = parseInt(document.getElementById('inputJumlahStok').value, 10) || 1;
      const satuan = document.getElementById('inputSatuanStok').value.trim() || 'unit';
      const kondisi = document.getElementById('inputKondisiStok').value;
      const keterangan = document.getElementById('inputKeteranganStok').value.trim();

      if (!nama_barang || !kategori) {
        showToast('Lengkapi nama barang dan kategori', 'error');
        return;
      }

      const payload = {
        kode_barang,
        tanggal_masuk,
        nama_barang,
        kategori,
        ruangan,
        jumlah,
        satuan,
        kondisi,
        keterangan
      };

      const btn = document.getElementById('btnSubmitStok');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Menyimpan...';
      }

      try {
        let res;
        if (id) {
          res = await fetch(`/api/stok-barang/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch('/api/stok-barang', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        const json = await res.json();
        if (json.success) {
          showToast(id ? 'Data barang berhasil diperbarui' : 'Barang baru berhasil ditambahkan ke inventaris klinik');
          closeModalStok();
          await fetchStokBarang();
        } else {
          showToast((json.message || 'Gagal menyimpan barang') + (json.error ? ': ' + json.error : ''), 'error');
        }
      } catch (err) {
        console.error('Error simpan stok barang:', err);
        showToast('Terjadi kesalahan jaringan', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = id
            ? '<i class="fa-solid fa-check"></i> <span>Perbarui Barang</span>'
            : '<i class="fa-solid fa-check"></i> <span>Simpan ke Stok Klinik</span>';
        }
      }
    }

    // ====================================================================
    // FORM CRUD TRANSAKSI
    // ====================================================================