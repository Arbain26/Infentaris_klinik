import { Body, Controller, Get, Put } from '@nestjs/common';
import { PengaturanService } from './pengaturan.service.js';
import { UpdatePengaturanDto } from './dto/update-pengaturan.dto.js';

@Controller()
export class PengaturanController {
  constructor(private readonly pengaturanService: PengaturanService) {}

  @Get('pengaturan')
  async getPengaturan() {
    return this.pengaturanService.getPengaturan();
  }

  @Put('pengaturan')
  async updatePengaturan(@Body() dto: UpdatePengaturanDto) {
    return this.pengaturanService.updatePengaturan(dto);
  }

  @Get('kategori')
  async getKategori() {
    return this.pengaturanService.getKategori();
  }
}
