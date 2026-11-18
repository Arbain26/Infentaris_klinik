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
import { StokBarangService } from './stok-barang.service.js';
import { CreateStokBarangDto } from './dto/create-stok-barang.dto.js';
import { UpdateStokBarangDto } from './dto/update-stok-barang.dto.js';
import { QueryStokBarangDto } from './dto/query-stok-barang.dto.js';

@Controller('stok-barang')
export class StokBarangController {
  constructor(private readonly stokBarangService: StokBarangService) {}

  @Get()
  async findAll(@Query() query: QueryStokBarangDto) {
    return this.stokBarangService.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateStokBarangDto) {
    return this.stokBarangService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStokBarangDto,
  ) {
    return this.stokBarangService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.stokBarangService.remove(id);
  }
}

