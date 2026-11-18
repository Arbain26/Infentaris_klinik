import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStokBarangDto } from './dto/create-stok-barang.dto.js';
import { UpdateStokBarangDto } from './dto/update-stok-barang.dto.js';
import { QueryStokBarangDto } from './dto/query-stok-barang.dto.js';

@Injectable()
export class StokBarangService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(val?: string): Date | null {
    if (!val) return null;
    return new Date(val.includes('T') ? val : `${val}T00:00:00.000Z`);
  }

  async findAll(query: QueryStokBarangDto) {
    const { kategori, kondisi, ruangan, search, page, limit } = query;

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit || '50', 10) || 50));

    const where: any = {};

    if (kategori && kategori !== 'semua') {
      where.kategori = kategori;
    }

    if (kondisi && kondisi !== 'semua') {
      where.kondisi = kondisi;
    }

    if (ruangan && ruangan !== 'semua') {
      where.ruangan = ruangan;
    }

    if (search && search.trim() !== '') {
      const clean = search.trim();
      where.OR = [
        { nama_barang: { contains: clean } },
        { kode_barang: { contains: clean } },
        { keterangan: { contains: clean } },
      ];
    }

    const totalCount = await this.prisma.stokBarang.count({ where });

    const records = await this.prisma.stokBarang.findMany({
      where,
      orderBy: { id: 'desc' },
      ...(isPaginated && {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    });

    const formattedRecords = records.map((r) => ({
      ...r,
      tanggal_masuk: r.tanggal_masuk ? r.tanggal_masuk.toISOString().split('T')[0] : null,
    }));

    return {
      success: true,
      count: formattedRecords.length,
      pagination: isPaginated
        ? {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
          }
        : undefined,
      data: formattedRecords,
    };
  }

  async create(dto: CreateStokBarangDto) {
    const cleanKode = (dto.kode_barang || '').trim().toUpperCase() || `BRG-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanNama = (dto.nama_barang || '').trim();
    const cleanKategori = (dto.kategori || 'Lainnya').trim().toUpperCase();
    const cleanJumlah = Math.max(0, Math.floor(Number(dto.jumlah) || 0));
    const cleanSatuan = (dto.satuan || 'Unit').trim();
    const cleanKondisi = ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(dto.kondisi || '') ? dto.kondisi! : 'Baik';
    const cleanRuangan = (dto.ruangan || 'Poli Umum').trim();
    const cleanSumberDana = (dto.sumber_dana || 'Klinik').trim();
    const cleanKeterangan = (dto.keterangan || 'Stok Awal Klinik').trim();

    const created = await this.prisma.stokBarang.create({
      data: {
        kode_barang: cleanKode,
        nama_barang: cleanNama,
        kategori: cleanKategori,
        jumlah: cleanJumlah,
        satuan: cleanSatuan,
        kondisi: cleanKondisi,
        ruangan: cleanRuangan,
        sumber_dana: cleanSumberDana,
        tanggal_masuk: this.parseDate(dto.tanggal_masuk) || new Date(),
        keterangan: cleanKeterangan,
      },
    });

    return {
      success: true,
      message: 'Stok barang berhasil ditambahkan ke inventaris klinik.',
      data: {
        ...created,
        tanggal_masuk: created.tanggal_masuk ? created.tanggal_masuk.toISOString().split('T')[0] : null,
      },
    };
  }

  async update(id: number, dto: UpdateStokBarangDto) {
    const existing = await this.prisma.stokBarang.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Data stok barang tidak ditemukan.');
    }

    const updateData: any = {};
    if (dto.kode_barang !== undefined) updateData.kode_barang = dto.kode_barang.trim().toUpperCase();
    if (dto.nama_barang !== undefined) updateData.nama_barang = dto.nama_barang.trim();
    if (dto.kategori !== undefined) updateData.kategori = dto.kategori.trim().toUpperCase();
    if (dto.jumlah !== undefined) updateData.jumlah = Math.max(0, Math.floor(Number(dto.jumlah) || 0));
    if (dto.satuan !== undefined) updateData.satuan = dto.satuan.trim();
    if (dto.kondisi !== undefined) {
      updateData.kondisi = ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(dto.kondisi) ? dto.kondisi : 'Baik';
    }
    if (dto.ruangan !== undefined) updateData.ruangan = dto.ruangan.trim();
    if (dto.sumber_dana !== undefined) updateData.sumber_dana = dto.sumber_dana.trim();
    if (dto.tanggal_masuk !== undefined) updateData.tanggal_masuk = this.parseDate(dto.tanggal_masuk);
    if (dto.keterangan !== undefined) updateData.keterangan = dto.keterangan.trim();

    const updated = await this.prisma.stokBarang.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Data stok barang berhasil diperbarui.',
      data: {
        ...updated,
        tanggal_masuk: updated.tanggal_masuk ? updated.tanggal_masuk.toISOString().split('T')[0] : null,
      },
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.stokBarang.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Data stok barang tidak ditemukan.');
    }

    await this.prisma.stokBarang.delete({ where: { id } });

    return {
      success: true,
      message: 'Data stok barang berhasil dihapus.',
    };
  }
}

