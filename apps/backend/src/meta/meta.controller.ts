import { Controller, Get, Query } from '@nestjs/common';
import { MetaService } from './meta.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Public()
  @Get('heroes')
  async getHeroStats(
    @Query('gameMode') gameMode?: string,
    @Query('mmrBracket') mmrBracket?: string,
    @Query('days') days: number = 7,
  ) {
    return this.metaService.getHeroStats(gameMode, mmrBracket, days);
  }

  @Public()
  @Get('tribes')
  async getTribeStats(
    @Query('gameMode') gameMode?: string,
    @Query('days') days: number = 7,
  ) {
    return this.metaService.getTribeStats(gameMode, days);
  }
}
