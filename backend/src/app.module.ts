import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { PengaturanModule } from './pengaturan/pengaturan.module.js';
import { TransaksiModule } from './transaksi/transaksi.module.js';
import { StokBarangModule } from './stok-barang/stok-barang.module.js';
import { SystemModule } from './system/system.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PengaturanModule,
    TransaksiModule,
    StokBarangModule,
    SystemModule,
  ],
})
export class AppModule {}
