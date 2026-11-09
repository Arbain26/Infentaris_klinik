import { IsOptional, IsString } from 'class-validator';

export class UpdatePengaturanDto {
  @IsOptional()
  @IsString()
  nama_klinik?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telepon?: string;

  @IsOptional()
  @IsString()
  kota?: string;

  @IsOptional()
  @IsString()
  jabatan_kiri?: string;

  @IsOptional()
  @IsString()
  nama_kiri?: string;

  @IsOptional()
  @IsString()
  nip_kiri?: string;

  @IsOptional()
  @IsString()
  jabatan_kanan?: string;

  @IsOptional()
  @IsString()
  nama_kanan?: string;
}
