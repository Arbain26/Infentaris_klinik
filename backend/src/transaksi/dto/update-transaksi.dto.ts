import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTransaksiDto {
  @IsOptional()
  @IsString()
  tanggal?: string;

  @IsOptional()
  @IsString()
  jenis?: string;

  @IsOptional()
  @IsString()
  kategori?: string;

  @IsOptional()
  @IsString()
  uraian?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Nominal harus >= 0' })
  nominal?: number;

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
