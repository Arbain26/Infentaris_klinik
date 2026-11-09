import { Module } from '@nestjs/common';
import { StokBarangController } from './stok-barang.controller.js';
import { StokBarangService } from './stok-barang.service.js';

@Module({
  controllers: [StokBarangController],
  providers: [StokBarangService],
  exports: [StokBarangService],
})
export class StokBarangModule {}
