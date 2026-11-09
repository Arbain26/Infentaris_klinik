import { IsOptional, IsString } from 'class-validator';

export class QueryTransaksiDto {
  @IsOptional()
  @IsString()
  tahun?: string;

  @IsOptional()
  @IsString()
  bulan?: string;

  @IsOptional()
  @IsString()
  jenis?: string;

  @IsOptional()
  @IsString()
  kategori?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dari_tanggal?: string;

  @IsOptional()
  @IsString()
  sampai_tanggal?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

