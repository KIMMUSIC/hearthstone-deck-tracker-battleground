import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get(':battletag')
  async getProfile(@Param('battletag') battletag: string) {
    const user = await this.usersService.getUserByBattleTag(battletag);
    const stats = await this.usersService.getUserStats(user.id);
    return {
      profile: {
        id: user.id,
        battleTag: user.battleTag,
        battleNetId: user.battleNetId,
        createdAt: user.createdAt,
      },
      stats,
    };
  }

  @Public()
  @Get(':battletag/matches')
  async getMatchHistory(
    @Param('battletag') battletag: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('gameMode') gameMode?: string,
    @Query('heroCardId') heroCardId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.usersService.getUserByBattleTag(battletag);
    return this.usersService.getMatchHistory(user.id, {
      page,
      pageSize,
      gameMode,
      heroCardId,
      startDate,
      endDate,
    });
  }

  @Public()
  @Get(':battletag/mmr')
  async getMmrHistory(
    @Param('battletag') battletag: string,
    @Query('gameMode') gameMode?: string,
    @Query('days') days: number = 30,
  ) {
    const user = await this.usersService.getUserByBattleTag(battletag);
    return this.usersService.getMmrHistory(user.id, gameMode, days);
  }
}
