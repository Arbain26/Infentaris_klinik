import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStokBarangDto {
  @IsOptional()
  @IsString()
  kode_barang?: string;

  @IsOptional()
  @IsString()
  nama_barang?: string;

  @IsOptional()
  @IsString()
  kategori?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  jumlah?: number;

  @IsOptional()
  @IsString()
  satuan?: string;

  @IsOptional()
  @IsString()
  kondisi?: string;

  @IsOptional()
  @IsString()
  ruangan?: string;

  @IsOptional()
  @IsString()
  sumber_dana?: string;

  @IsOptional()
  @IsString()
  tanggal_masuk?: string;

  @IsOptional()
  @IsString()
  keterangan?: string;
}

