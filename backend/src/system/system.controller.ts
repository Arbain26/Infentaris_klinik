import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SystemService } from './system.service.js';

@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getHealth() {
    return this.systemService.getHealth();
  }

  @Get('backup')
  async getBackup(@Res() res: Response) {
    const backup = await this.systemService.getBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="backup_klinik_${dateStr}.json"`,
    );
    return res.send(JSON.stringify(backup, null, 2));
  }
}
