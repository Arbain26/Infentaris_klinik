import { Module } from '@nestjs/common';
import { TransaksiController } from './transaksi.controller.js';
import { TransaksiService } from './transaksi.service.js';

@Module({
  controllers: [TransaksiController],
  providers: [TransaksiService],
  exports: [TransaksiService],
})
export class TransaksiModule {}
