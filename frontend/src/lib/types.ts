export interface PengaturanKlinik {
  id: number;
  nama_klinik: string;
  alamat: string;
  email: string;
  telepon: string;
  kota: string;
  jabatan_kiri: string;
  nama_kiri: string;
  nip_kiri: string;
  jabatan_kanan: string;
  nama_kanan: string;
}

export interface Transaksi {
  id: number;
  tanggal: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  kategori: string;
  uraian: string;
  volume: number;
  satuan: string;
  harga_satuan: number;
  nominal: number;
  metode: string;
  bukti_nota?: string | null;
  foto_bukti?: string | null;
  created_at?: string;
}

export interface StokBarang {
  id: number;
  kode_barang?: string | null;
  nama_barang: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  ruangan: string;
  sumber_dana?: string | null;
  tanggal_masuk?: string | null;
  keterangan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

