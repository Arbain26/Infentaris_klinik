import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ResetSaldoDto {
  @IsNotEmpty({ message: 'Target saldo wajib diisi' })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Target saldo harus >= 0' })
  target_saldo: number;

  @IsOptional()
  @IsString()
  tanggal?: string;

  @IsOptional()
  @IsString()
  keterangan?: string;

  @IsOptional()
  @IsString()
  mode?: string; // 'bersihkan_dan_set' atau 'selisih'
}
