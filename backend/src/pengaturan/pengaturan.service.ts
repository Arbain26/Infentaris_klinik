import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdatePengaturanDto } from './dto/update-pengaturan.dto.js';

@Injectable()
export class PengaturanService {
  private readonly logger = new Logger(PengaturanService.name);

  private readonly defaultSetting = {
    id: 1,
    nama_klinik: 'KLINIK AISYIYAH PANGKAJENE',
    alamat: 'Jl. Andi Cammi. No. 17 Pangkajene Kabupaten Sidenreng Rappang, Provinsi Sulawesi Selatan',
    email: 'klinikaisyiyahpangkajene@gmail.com',
    telepon: '0878-3117-7100',
    kota: 'Pangkajene',
    jabatan_kiri: 'Kepala Klinik',
    nama_kiri: 'dr. Syah Rizal Syam Pohan',
    nip_kiri: 'SIP: 139/SIPD/DPMPTSP/11/2022',
    jabatan_kanan: 'Pemegang Barang',
    nama_kanan: 'Hera A.md.Keb',
  };

  private readonly defaultCategories = [
    'ALAT MEDIS',
    'ALAT KANTOR',
    'ALAT LISTRIK',
    'ALAT KEBERSIHAN',
    'MEUBEL & ASET',
    'OBAT & BHP',
    'TAGIHAN RUTIN',
    'DANA MASUK',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getPengaturan() {
    let setting = await this.prisma.pengaturanKlinik.findUnique({
      where: { id: 1 },
    });

    if (!setting) {
      setting = await this.prisma.pengaturanKlinik.create({
        data: this.defaultSetting,
      });
    }

    return {
      success: true,
      data: setting,
    };
  }

  async updatePengaturan(dto: UpdatePengaturanDto) {
    const updated = await this.prisma.pengaturanKlinik.upsert({
      where: { id: 1 },
      update: {
        ...(dto.nama_klinik && { nama_klinik: dto.nama_klinik.trim() }),
        ...(dto.alamat && { alamat: dto.alamat.trim() }),
        ...(dto.email && { email: dto.email.trim() }),
        ...(dto.telepon && { telepon: dto.telepon.trim() }),
        ...(dto.kota && { kota: dto.kota.trim() }),
        ...(dto.jabatan_kiri && { jabatan_kiri: dto.jabatan_kiri.trim() }),
        ...(dto.nama_kiri && { nama_kiri: dto.nama_kiri.trim() }),
        ...(dto.nip_kiri && { nip_kiri: dto.nip_kiri.trim() }),
        ...(dto.jabatan_kanan && { jabatan_kanan: dto.jabatan_kanan.trim() }),
        ...(dto.nama_kanan && { nama_kanan: dto.nama_kanan.trim() }),
      },
      create: {
        ...this.defaultSetting,
        ...dto,
      },
    });

    return {
      success: true,
      message: 'Pengaturan klinik berhasil diperbarui.',
      data: updated,
    };
  }

  async getKategori() {
    const tx = await this.prisma.transaksi.findMany({
      select: { kategori: true },
      distinct: ['kategori'],
    });

    const dbCategories = tx.map((t) => t.kategori).filter(Boolean);
    const combined = Array.from(new Set([...this.defaultCategories, ...dbCategories])).sort();

    return {
      success: true,
      data: combined,
    };
  }
}

