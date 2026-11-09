import { Injectable } from '@nestjs/common';
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
}
