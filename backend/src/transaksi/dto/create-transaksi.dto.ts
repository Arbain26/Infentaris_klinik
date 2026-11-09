import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransaksiDto {
  @IsNotEmpty({ message: 'Tanggal wajib diisi' })
  @IsString()
  tanggal: string;

  @IsOptional()
  @IsString()
  jenis?: string;

  @IsNotEmpty({ message: 'Kategori wajib diisi' })
  @IsString()
  kategori: string;

  @IsNotEmpty({ message: 'Uraian wajib diisi' })
  @IsString()
  uraian: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  volume?: number;

  @IsOptional()
  @IsString()
  satuan?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  harga_satuan?: number;

  @IsNotEmpty({ message: 'Nominal wajib diisi' })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Nominal harus >= 0' })
  nominal: number;

  @IsOptional()
  @IsString()
  metode?: string;

  @IsOptional()
  @IsString()
  bukti_nota?: string;

  @IsOptional()
  @IsString()
  foto_bukti?: string;
}
