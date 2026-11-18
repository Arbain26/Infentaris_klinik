import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TransaksiService } from './transaksi.service.js';
import { CreateTransaksiDto } from './dto/create-transaksi.dto.js';
import { UpdateTransaksiDto } from './dto/update-transaksi.dto.js';
import { QueryTransaksiDto } from './dto/query-transaksi.dto.js';
import { ResetSaldoDto } from './dto/reset-saldo.dto.js';

@Controller('transaksi')
export class TransaksiController {
  constructor(private readonly transaksiService: TransaksiService) {}

  @Get()
  async findAll(@Query() query: QueryTransaksiDto) {
    return this.transaksiService.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateTransaksiDto) {
    return this.transaksiService.create(dto);
  }

  @Post('reset-saldo')
  async resetSaldo(@Body() dto: ResetSaldoDto) {
    return this.transaksiService.resetSaldo(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransaksiDto,
  ) {
    return this.transaksiService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.transaksiService.remove(id);
  }
}

