import { IsOptional, IsString } from 'class-validator';

export class QueryStokBarangDto {
  @IsOptional()
  @IsString()
  kategori?: string;

  @IsOptional()
  @IsString()
  kondisi?: string;

  @IsOptional()
  @IsString()
  ruangan?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

