import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SystemService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    let dbStatus = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }

    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: `${uptimeSeconds}s`,
      database: {
        provider: 'mysql',
        status: dbStatus,
      },
    };
  }

  async getBackup() {
    const [pengaturan, transaksi, stok] = await Promise.all([
      this.prisma.pengaturanKlinik.findMany(),
      this.prisma.transaksi.findMany(),
      this.prisma.stokBarang.findMany(),
    ]);

    const formattedTransaksi = transaksi.map((t) => ({
      ...t,
      tanggal: t.tanggal.toISOString().split('T')[0],
      harga_satuan: Number(t.harga_satuan),
      nominal: Number(t.nominal),
    }));

    const formattedStok = stok.map((s) => ({
      ...s,
      tanggal_masuk: s.tanggal_masuk ? s.tanggal_masuk.toISOString().split('T')[0] : null,
    }));

    return {
      success: true,
      exported_at: new Date().toISOString(),
      counts: {
        pengaturan: pengaturan.length,
        transaksi: formattedTransaksi.length,
        stok_barang: formattedStok.length,
      },
      data: {
        pengaturan_klinik: pengaturan,
        transaksi: formattedTransaksi,
        stok_barang: formattedStok,
      },
    };
  }

  async restoreBackup(payload: any) {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Format payload JSON tidak valid.');
    }

    const rootData = payload.data || payload;
    const pengaturanKlinik = rootData.pengaturan_klinik;
    const transaksi = rootData.transaksi;
    const stokBarang = rootData.stok_barang;

    if (!pengaturanKlinik && !transaksi && !stokBarang) {
      throw new BadRequestException('File JSON cadangan tidak memiliki data tabel yang valid.');
    }

    return await this.prisma.$transaction(async (tx) => {
      let restoredPengaturan = 0;
      let restoredTransaksi = 0;
      let restoredStok = 0;

      // 1. Restore Pengaturan Klinik
      if (pengaturanKlinik) {
        const item = Array.isArray(pengaturanKlinik) ? pengaturanKlinik[0] : pengaturanKlinik;
        if (item) {
          const { id, ...dataToSave } = item;
          await tx.pengaturanKlinik.upsert({
            where: { id: 1 },
            update: dataToSave,
            create: { id: 1, ...dataToSave },
          });
          restoredPengaturan = 1;
        }
      }

      // 2. Restore Transaksi
      if (Array.isArray(transaksi)) {
        await tx.transaksi.deleteMany();
        for (const item of transaksi) {
          const tglStr = item.tanggal ? String(item.tanggal).split('T')[0] : new Date().toISOString().split('T')[0];
          await tx.transaksi.create({
            data: {
              tanggal: new Date(`${tglStr}T00:00:00.000Z`),
              jenis: item.jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran',
              kategori: (item.kategori || 'LAINNYA').trim().toUpperCase(),
              uraian: (item.uraian || '').trim(),
              volume: Math.max(1, Math.floor(Number(item.volume) || 1)),
              satuan: (item.satuan || 'Unit').trim(),
              harga_satuan: BigInt(Math.max(0, Math.floor(Number(item.harga_satuan) || 0))),
              nominal: BigInt(Math.max(0, Math.floor(Number(item.nominal) || 0))),
              metode: item.metode === 'Transfer' ? 'Transfer' : 'Tunai',
              bukti_nota: item.bukti_nota || null,
              foto_bukti: item.foto_bukti || null,
            },
          });
          restoredTransaksi++;
        }
      }

      // 3. Restore Stok Barang
      if (Array.isArray(stokBarang)) {
        await tx.stokBarang.deleteMany();
        for (const item of stokBarang) {
          let tglMasuk: Date | null = null;
          if (item.tanggal_masuk) {
            const tglStr = String(item.tanggal_masuk).split('T')[0];
            tglMasuk = new Date(`${tglStr}T00:00:00.000Z`);
          }
          await tx.stokBarang.create({
            data: {
              kode_barang: item.kode_barang ? String(item.kode_barang).trim().toUpperCase() : null,
              nama_barang: String(item.nama_barang || '').trim(),
              kategori: (item.kategori || 'Lainnya').trim().toUpperCase(),
              jumlah: Math.max(0, Math.floor(Number(item.jumlah) || 0)),
              satuan: (item.satuan || 'Unit').trim(),
              kondisi: ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(item.kondisi) ? item.kondisi : 'Baik',
              ruangan: (item.ruangan || 'Poli Umum').trim(),
              sumber_dana: (item.sumber_dana || 'Klinik').trim(),
              tanggal_masuk: tglMasuk,
              keterangan: item.keterangan || null,
            },
          });
          restoredStok++;
        }
      }

      return {
        success: true,
        message: 'Data cadangan berhasil dipulihkan (restore) ke database.',
        restored: {
          pengaturan: restoredPengaturan,
          transaksi: restoredTransaksi,
          stok_barang: restoredStok,
        },
      };
    });
  }
}
