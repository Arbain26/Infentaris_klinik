import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransaksiDto } from './dto/create-transaksi.dto.js';
import { UpdateTransaksiDto } from './dto/update-transaksi.dto.js';
import { QueryTransaksiDto } from './dto/query-transaksi.dto.js';
import { ResetSaldoDto } from './dto/reset-saldo.dto.js';

@Injectable()
export class TransaksiService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(val: string): Date {
    return new Date(val.includes('T') ? val : `${val}T00:00:00.000Z`);
  }

  async findAll(query: QueryTransaksiDto) {
    const { tahun, bulan, jenis, kategori, search, dari_tanggal, sampai_tanggal, page, limit } = query;

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit || '50', 10) || 50));

    const where: any = {};

    if (jenis && jenis !== 'semua') {
      where.jenis = jenis;
    }

    if (kategori && kategori !== 'semua') {
      where.kategori = kategori;
    }

    if (dari_tanggal || sampai_tanggal) {
      where.tanggal = {};
      if (dari_tanggal) {
        where.tanggal.gte = this.parseDate(dari_tanggal);
      }
      if (sampai_tanggal) {
        where.tanggal.lte = this.parseDate(sampai_tanggal);
      }
    } else if (tahun && tahun !== 'semua') {
      const year = parseInt(tahun, 10);
      if (bulan && bulan !== 'semua') {
        const month = parseInt(bulan, 10) - 1;
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
        where.tanggal = { gte: startDate, lte: endDate };
      } else {
        const startDate = new Date(Date.UTC(year, 0, 1));
        const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        where.tanggal = { gte: startDate, lte: endDate };
      }
    }

    if (search && search.trim() !== '') {
      const clean = search.trim();
      where.OR = [
        { uraian: { contains: clean } },
        { kategori: { contains: clean } },
      ];
    }

    const totalCount = await this.prisma.transaksi.count({ where });

    const records = await this.prisma.transaksi.findMany({
      where,
      orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
      ...(isPaginated && {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    });

    const formattedRecords = records.map((r) => ({
      ...r,
      tanggal: r.tanggal.toISOString().split('T')[0],
      harga_satuan: Number(r.harga_satuan),
      nominal: Number(r.nominal),
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

  async create(dto: CreateTransaksiDto) {
    const cleanJenis = dto.jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const cleanKategori = (dto.kategori || '').trim().toUpperCase();
    const cleanUraian = (dto.uraian || '').trim();
    const cleanSatuan = (dto.satuan || '-').trim();
    const cleanNominal = Math.max(0, Math.floor(Number(dto.nominal) || 0));
    const cleanHargaSatuan = Math.max(0, Math.floor(Number(dto.harga_satuan) || 0));
    const cleanVolume = Math.max(1, Math.floor(Number(dto.volume) || 1));
    const cleanMetode = dto.metode === 'Transfer' ? 'Transfer' : 'Tunai';

    const created = await this.prisma.transaksi.create({
      data: {
        tanggal: this.parseDate(dto.tanggal),
        jenis: cleanJenis,
        kategori: cleanKategori,
        uraian: cleanUraian,
        volume: cleanVolume,
        satuan: cleanSatuan,
        harga_satuan: BigInt(cleanHargaSatuan),
        nominal: BigInt(cleanNominal),
        metode: cleanMetode,
        bukti_nota: dto.bukti_nota?.trim() || null,
        foto_bukti: dto.foto_bukti?.trim() || null,
      },
    });

    return {
      success: true,
      message: 'Transaksi berhasil ditambahkan.',
      data: {
        ...created,
        tanggal: created.tanggal.toISOString().split('T')[0],
        harga_satuan: Number(created.harga_satuan),
        nominal: Number(created.nominal),
      },
    };
  }

  async update(id: number, dto: UpdateTransaksiDto) {
    const existing = await this.prisma.transaksi.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Data transaksi tidak ditemukan.');
    }

    const updateData: any = {};
    if (dto.tanggal) updateData.tanggal = this.parseDate(dto.tanggal);
    if (dto.jenis) updateData.jenis = dto.jenis === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    if (dto.kategori) updateData.kategori = dto.kategori.trim().toUpperCase();
    if (dto.uraian) updateData.uraian = dto.uraian.trim();
    if (dto.volume !== undefined) updateData.volume = Math.max(1, Math.floor(Number(dto.volume) || 1));
    if (dto.satuan) updateData.satuan = dto.satuan.trim();
    if (dto.harga_satuan !== undefined) updateData.harga_satuan = BigInt(Math.max(0, Math.floor(Number(dto.harga_satuan) || 0)));
    if (dto.nominal !== undefined) updateData.nominal = BigInt(Math.max(0, Math.floor(Number(dto.nominal) || 0)));
    if (dto.metode) updateData.metode = dto.metode === 'Transfer' ? 'Transfer' : 'Tunai';
    if (dto.bukti_nota !== undefined) updateData.bukti_nota = dto.bukti_nota ? dto.bukti_nota.trim() : null;
    if (dto.foto_bukti !== undefined) updateData.foto_bukti = dto.foto_bukti ? dto.foto_bukti.trim() : null;

    const updated = await this.prisma.transaksi.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Transaksi berhasil diperbarui.',
      data: {
        ...updated,
        tanggal: updated.tanggal.toISOString().split('T')[0],
        harga_satuan: Number(updated.harga_satuan),
        nominal: Number(updated.nominal),
      },
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.transaksi.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Data transaksi tidak ditemukan.');
    }

    await this.prisma.transaksi.delete({ where: { id } });

    return {
      success: true,
      message: 'Data transaksi berhasil dihapus.',
    };
  }

  async resetSaldo(dto: ResetSaldoDto) {
    const cleanTargetSaldo = Math.max(0, Math.floor(Number(dto.target_saldo) || 0));
    const cleanTanggal = dto.tanggal || new Date().toISOString().split('T')[0];
    const cleanKeterangan = (dto.keterangan || 'Saldo Awal Kas Klinik').trim();
    const isResetClean = dto.mode === 'bersihkan_dan_set';

    return await this.prisma.$transaction(async (tx) => {
      if (isResetClean) {
        const pengeluaranAgg = await tx.transaksi.aggregate({
          _sum: { nominal: true },
          where: { jenis: 'Pengeluaran' },
        });
        const totalPengeluaran = Number(pengeluaranAgg._sum.nominal || 0);

        await tx.transaksi.deleteMany({
          where: { jenis: 'Pemasukan' },
        });

        const nominalPemasukanBaru = cleanTargetSaldo + totalPengeluaran;

        await tx.transaksi.create({
          data: {
            tanggal: this.parseDate(cleanTanggal),
            jenis: 'Pemasukan',
            kategori: 'DANA MASUK',
            uraian: cleanKeterangan,
            satuan: '-',
            volume: 1,
            harga_satuan: BigInt(nominalPemasukanBaru),
            nominal: BigInt(nominalPemasukanBaru),
            metode: 'Transfer',
          },
        });

        return {
          success: true,
          message: `Saldo kas berhasil diatur ulang menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            nominal_pemasukan: nominalPemasukanBaru,
            total_pengeluaran: totalPengeluaran,
          },
        };
      } else {
        const pemasukanAgg = await tx.transaksi.aggregate({
          _sum: { nominal: true },
          where: { jenis: 'Pemasukan' },
        });
        const pengeluaranAgg = await tx.transaksi.aggregate({
          _sum: { nominal: true },
          where: { jenis: 'Pengeluaran' },
        });

        const totalPemasukan = Number(pemasukanAgg._sum.nominal || 0);
        const totalPengeluaran = Number(pengeluaranAgg._sum.nominal || 0);
        const currentSaldo = totalPemasukan - totalPengeluaran;
        const selisih = cleanTargetSaldo - currentSaldo;

        if (selisih > 0) {
          await tx.transaksi.create({
            data: {
              tanggal: this.parseDate(cleanTanggal),
              jenis: 'Pemasukan',
              kategori: 'DANA MASUK',
              uraian: cleanKeterangan || 'Penyesuaian Tambahan Saldo Kas',
              satuan: '-',
              volume: 1,
              harga_satuan: BigInt(selisih),
              nominal: BigInt(selisih),
              metode: 'Transfer',
            },
          });
        } else if (selisih < 0) {
          const absSelisih = Math.abs(selisih);
          await tx.transaksi.create({
            data: {
              tanggal: this.parseDate(cleanTanggal),
              jenis: 'Pengeluaran',
              kategori: 'PENYESUAIAN KAS',
              uraian: cleanKeterangan || 'Penyesuaian Koreksi Saldo Kas',
              satuan: '-',
              volume: 1,
              harga_satuan: BigInt(absSelisih),
              nominal: BigInt(absSelisih),
              metode: 'Tunai',
            },
          });
        }

        return {
          success: true,
          message: `Saldo kas berhasil disesuaikan menjadi Rp ${cleanTargetSaldo.toLocaleString('id-ID')}`,
          data: {
            target_saldo: cleanTargetSaldo,
            selisih,
          },
        };
      }
    });
  }
}

