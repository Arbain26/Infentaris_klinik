import { PengaturanKlinik, Transaksi, StokBarang, PaginationInfo } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }

  return json;
}

export const api = {
  // Pengaturan & Kategori
  getPengaturan: async () => {
    const res = await fetchJson<{ success: boolean; data: PengaturanKlinik }>('/pengaturan');
    return res.data;
  },

  updatePengaturan: async (data: Partial<PengaturanKlinik>) => {
    const res = await fetchJson<{ success: boolean; message: string; data: PengaturanKlinik }>(
      '/pengaturan',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  getKategori: async () => {
    const res = await fetchJson<{ success: boolean; data: string[] }>('/kategori');
    return res.data;
  },

  // Transaksi
  getTransaksi: async (params?: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString();
    const endpoint = `/transaksi${qStr ? `?${qStr}` : ''}`;
    return fetchJson<{
      success: boolean;
      count: number;
      pagination?: PaginationInfo;
      data: Transaksi[];
    }>(endpoint);
  },

  createTransaksi: async (data: Partial<Transaksi>) => {
    return fetchJson<{ success: boolean; message: string; data: Transaksi }>('/transaksi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTransaksi: async (id: number, data: Partial<Transaksi>) => {
    return fetchJson<{ success: boolean; message: string; data: Transaksi }>(`/transaksi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTransaksi: async (id: number) => {
    return fetchJson<{ success: boolean; message: string }>(`/transaksi/${id}`, {
      method: 'DELETE',
    });
  },

  resetSaldo: async (data: { target_saldo: number; tanggal?: string; keterangan?: string; mode?: string }) => {
    return fetchJson<{ success: boolean; message: string; data: any }>('/transaksi/reset-saldo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Stok Barang
  getStokBarang: async (params?: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString();
    const endpoint = `/stok-barang${qStr ? `?${qStr}` : ''}`;
    return fetchJson<{
      success: boolean;
      count: number;
      pagination?: PaginationInfo;
      data: StokBarang[];
    }>(endpoint);
  },

  createStokBarang: async (data: Partial<StokBarang>) => {
    return fetchJson<{ success: boolean; message: string; data: StokBarang }>('/stok-barang', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStokBarang: async (id: number, data: Partial<StokBarang>) => {
    return fetchJson<{ success: boolean; message: string; data: StokBarang }>(`/stok-barang/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteStokBarang: async (id: number) => {
    return fetchJson<{ success: boolean; message: string }>(`/stok-barang/${id}`, {
      method: 'DELETE',
    });
  },

  // Backup & Health
  getBackupUrl: () => `${API_BASE}/backup`,
  getHealth: async () => {
    return fetchJson<any>('/health');
  },
};

