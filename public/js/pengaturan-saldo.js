/**
 * ====================================================================
 * PENGATURAN KLINIK & PENGATURAN SALDO
 * Sistem Inventaris & Laporan Keuangan Klinik
 * ====================================================================
 */

    // Ambil Data Pengaturan Klinik dari API
    async function fetchPengaturan() {
      try {
        const res = await fetch('/api/pengaturan');
        const json = await res.json();
        if (json.success && json.data) {
          clinicSettings = json.data;
          updateClinicSettingsUI();
        }
      } catch (err) {
        console.error('Gagal mengambil pengaturan:', err);
      }
    }

    // Update Tampilan Berdasarkan Pengaturan Klinik
    function updateClinicSettingsUI() {
      const headerTitle = document.getElementById('headerNamaKlinikTitle');
      if (headerTitle) headerTitle.innerText = clinicSettings.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE';

      const headerAlamat = document.getElementById('headerAlamatKlinik');
      if (headerAlamat) {
        headerAlamat.innerHTML = `
          <i class="fa-solid fa-location-dot text-emerald-600 text-xs"></i>
          <span>${clinicSettings.alamat || 'Pangkajene, Sulawesi Selatan'}</span>
        `;
      }

      const headerKontak = document.getElementById('headerKontakKlinik');
      if (headerKontak) {
        headerKontak.innerText = `Email: ${clinicSettings.email || '-'} • Hp. ${clinicSettings.telepon || '-'}`;
      }

      const logoImg = document.getElementById('headerLogoImg');
      if (logoImg) logoImg.src = typeof LOGO_AISYIYAH_SRC !== 'undefined' ? LOGO_AISYIYAH_SRC : LOGO_AISYIYAH_BASE64;

      const reportLogo = document.getElementById('reportKopLogoImg');
      if (reportLogo) reportLogo.src = typeof LOGO_AISYIYAH_SRC !== 'undefined' ? LOGO_AISYIYAH_SRC : LOGO_AISYIYAH_BASE64;

      const footerCredit = document.getElementById('footerCredit');
      if (footerCredit) {
        footerCredit.innerText = `Sistem Laporan Inventaris & Pengeluaran Klinik • ${clinicSettings.nama_klinik}`;
      }

      // Update Kop Resmi Laporan
      const reportNama = document.getElementById('reportKopNamaKlinik');
      if (reportNama) reportNama.innerText = clinicSettings.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE';
      const reportAlamat = document.getElementById('reportKopAlamatKlinik');
      if (reportAlamat) reportAlamat.innerText = clinicSettings.alamat || 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan';
      const reportKontak = document.getElementById('reportKopKontakKlinik');
      if (reportKontak) reportKontak.innerText = `Email: ${clinicSettings.email || 'klinikaisyiyahpangkajene@gmail.com'} • Hp. ${clinicSettings.telepon || '0878-3117-7100'}`;

      // Update Tanda Tangan Laporan
      const signJabKiri = document.getElementById('signOnScreenJabatanKiri');
      if (signJabKiri) signJabKiri.innerText = clinicSettings.jabatan_kiri || 'Kepala Klinik';
      const signNamaKiri = document.getElementById('signOnScreenNamaKiri');
      if (signNamaKiri) signNamaKiri.innerText = clinicSettings.nama_kiri || 'dr. Syah Rizal Syam Pohan';
      const signNipKiri = document.getElementById('signOnScreenNipKiri');
      if (signNipKiri) signNipKiri.innerText = clinicSettings.nip_kiri || 'SIP: 139/SIPD/DPMPTSP/11/2022';

      const signKotaTgl = document.getElementById('signOnScreenKotaTanggal');
      const todayIndo = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      if (signKotaTgl) signKotaTgl.innerText = `${clinicSettings.kota || 'Pangkajene'}, ${todayIndo}`;
      const signJabKanan = document.getElementById('signOnScreenJabatanKanan');
      if (signJabKanan) signJabKanan.innerText = clinicSettings.jabatan_kanan || 'Pemegang Barang';
      const signNamaKanan = document.getElementById('signOnScreenNamaKanan');
      if (signNamaKanan) signNamaKanan.innerText = clinicSettings.nama_kanan || 'Hera A.md.Keb';
    }


    function openModalPengaturan() {
      document.getElementById('cfgNamaKlinik').value = clinicSettings.nama_klinik || 'KLINIK AISYIYAH PANGKAJENE';
      document.getElementById('cfgKota').value = clinicSettings.kota || 'Pangkajene';
      if (document.getElementById('cfgAlamat')) document.getElementById('cfgAlamat').value = clinicSettings.alamat || 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan';
      if (document.getElementById('cfgEmail')) document.getElementById('cfgEmail').value = clinicSettings.email || 'klinikaisyiyahpangkajene@gmail.com';
      if (document.getElementById('cfgTelepon')) document.getElementById('cfgTelepon').value = clinicSettings.telepon || '0878-3117-7100';
      document.getElementById('cfgJabatanKiri').value = clinicSettings.jabatan_kiri || 'Kepala Klinik';
      document.getElementById('cfgNamaKiri').value = clinicSettings.nama_kiri || 'dr. Syah Rizal Syam Pohan';
      document.getElementById('cfgNipKiri').value = clinicSettings.nip_kiri || 'SIP: 139/SIPD/DPMPTSP/11/2022';
      document.getElementById('cfgJabatanKanan').value = clinicSettings.jabatan_kanan || 'Pemegang Barang';
      document.getElementById('cfgNamaKanan').value = clinicSettings.nama_kanan || 'Hera A.md.Keb';

      const modal = document.getElementById('modalPengaturan');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeModalPengaturan() {
      const modal = document.getElementById('modalPengaturan');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    async function submitFormPengaturan(e) {
      e.preventDefault();

      const payload = {
        nama_klinik: document.getElementById('cfgNamaKlinik').value.trim(),
        alamat: document.getElementById('cfgAlamat') ? document.getElementById('cfgAlamat').value.trim() : clinicSettings.alamat,
        email: document.getElementById('cfgEmail') ? document.getElementById('cfgEmail').value.trim() : clinicSettings.email,
        telepon: document.getElementById('cfgTelepon') ? document.getElementById('cfgTelepon').value.trim() : clinicSettings.telepon,
        kota: document.getElementById('cfgKota').value.trim(),
        jabatan_kiri: document.getElementById('cfgJabatanKiri').value.trim(),
        nama_kiri: document.getElementById('cfgNamaKiri').value.trim(),
        nip_kiri: document.getElementById('cfgNipKiri').value.trim(),
        jabatan_kanan: document.getElementById('cfgJabatanKanan').value.trim(),
        nama_kanan: document.getElementById('cfgNamaKanan').value.trim()
      };

      try {
        const res = await fetch('/api/pengaturan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          clinicSettings = { ...clinicSettings, ...payload };
          updateClinicSettingsUI();
          showToast('Pengaturan klinik berhasil disimpan');
          closeModalPengaturan();
        } else {
          showToast(json.message || 'Gagal menyimpan pengaturan', 'error');
        }
      } catch (err) {
        console.error('Error simpan pengaturan:', err);
        showToast('Gagal menyimpan pengaturan klinik', 'error');
      }
    }

    function openModalAturSaldo() {
      let totalPemasukan = 0;
      let totalPengeluaran = 0;
      filteredTransactions.forEach(item => {
        const nominal = parseInt(item.nominal, 10) || 0;
        if (item.jenis === 'Pemasukan') totalPemasukan += nominal;
        else totalPengeluaran += nominal;
      });
      const sisaSaldo = totalPemasukan - totalPengeluaran;

      const modalPemasukan = document.getElementById('aturModalTotalPemasukan');
      if (modalPemasukan) modalPemasukan.innerText = formatRupiah(totalPemasukan);
      const modalPengeluaran = document.getElementById('aturModalTotalPengeluaran');
      if (modalPengeluaran) modalPengeluaran.innerText = formatRupiah(totalPengeluaran);
      const modalSaldo = document.getElementById('aturModalSisaSaldo');
      if (modalSaldo) modalSaldo.innerText = formatRupiah(sisaSaldo);

      // Default target saldo = saldo saat ini jika wajar, atau kosongkan
      const inputTarget = document.getElementById('inputTargetSaldo');
      if (inputTarget) {
        inputTarget.value = (sisaSaldo > 0 && sisaSaldo < 1000000000) ? sisaSaldo : '';
        const prev = document.getElementById('targetSaldoPreview');
        if (prev) prev.innerText = inputTarget.value ? formatRupiah(parseInt(inputTarget.value, 10)) : 'Rp 0';
      }

      const inputTgl = document.getElementById('inputAturTanggal');
      if (inputTgl) inputTgl.value = new Date().toISOString().split('T')[0];

      const modal = document.getElementById('modalAturSaldo');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function closeModalAturSaldo() {
      const modal = document.getElementById('modalAturSaldo');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    // Listener realtime input target saldo
    const elTargetInput = document.getElementById('inputTargetSaldo');
    if (elTargetInput) {
      elTargetInput.addEventListener('input', function(e) {
        const val = parseInt(e.target.value, 10);
        const prev = document.getElementById('targetSaldoPreview');
        if (prev) prev.innerText = val ? formatRupiah(val) : 'Rp 0';
      });
    }

    async function submitFormAturSaldo(e) {
      e.preventDefault();
      const targetSaldo = parseInt(document.getElementById('inputTargetSaldo').value, 10) || 0;
      const tanggal = document.getElementById('inputAturTanggal').value;
      const keterangan = document.getElementById('inputAturKeterangan').value.trim();
      const modeRadio = document.querySelector('input[name="modeAturSaldo"]:checked');
      const mode = modeRadio ? modeRadio.value : 'bersihkan_dan_set';

      const btn = document.getElementById('btnSubmitAturSaldo');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Memproses...';
      }

      try {
        const res = await fetch('/api/transaksi/reset-saldo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_saldo: targetSaldo,
            tanggal: tanggal,
            keterangan: keterangan,
            mode: mode
          })
        });
        const json = await res.json();
        if (json.success) {
          showToast(json.message);
          closeModalAturSaldo();
          await fetchTransaksi();
        } else {
          showToast(json.message || 'Gagal mengatur ulang saldo', 'error');
        }
      } catch (err) {
        console.error('Error reset saldo:', err);
        showToast('Terjadi kesalahan jaringan', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> <span>Terapkan Saldo Baru</span>';
        }
      }
    }