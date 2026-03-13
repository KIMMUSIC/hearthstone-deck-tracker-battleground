import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseBattleTag } from '../common/utils/battletag';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserByBattleTag(battleTagParam: string) {
    const battleTag = parseBattleTag(battleTagParam);
    const user = await this.prisma.user.findUnique({
      where: { battleTag },
    });
    if (!user) {
      throw new NotFoundException(`User ${battleTag} not found`);
    }
    return user;
  }

  async getUserStats(userId: string) {
    const [matchAgg, favoriteHero] = await Promise.all([
      this.prisma.match.aggregate({
        where: { userId },
        _count: true,
        _avg: { placement: true },
      }),
      this.prisma.match.groupBy({
        by: ['heroCardId'],
        where: { userId },
        _count: { heroCardId: true },
        orderBy: { _count: { heroCardId: 'desc' } },
        take: 1,
      }),
    ]);

    const totalGames = matchAgg._count;
    const avgPlacement = matchAgg._avg.placement ?? 0;

    let top4Rate = 0;
    if (totalGames > 0) {
      const top4Count = await this.prisma.match.count({
        where: { userId, placement: { lte: 4 } },
      });
      top4Rate = top4Count / totalGames;
    }

    return {
      totalGames,
      avgPlacement: Math.round(avgPlacement * 100) / 100,
      top4Rate: Math.round(top4Rate * 10000) / 10000,
      favoriteHero: favoriteHero[0]?.heroCardId ?? null,
    };
  }

  async getMatchHistory(
    userId: string,
    query: {
      page: number;
      pageSize: number;
      gameMode?: string;
      heroCardId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { page = 1, pageSize = 20, gameMode, heroCardId, startDate, endDate } = query;

    const where: Record<string, unknown> = { userId };
    if (gameMode) where.gameMode = gameMode;
    if (heroCardId) where.heroCardId = heroCardId;
    if (startDate || endDate) {
      const startedAt: Record<string, Date> = {};
      if (startDate) startedAt.gte = new Date(startDate);
      if (endDate) startedAt.lte = new Date(endDate);
      where.startedAt = startedAt;
    }

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        include: { opponents: true },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.match.count({ where }),
    ]);

    return {
      data: matches,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getMmrHistory(userId: string, gameMode?: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Record<string, unknown> = {
      userId,
      recordedAt: { gte: since },
    };
    if (gameMode) where.gameMode = gameMode;

    return this.prisma.mmrHistory.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
      select: {
        mmr: true,
        matchId: true,
        recordedAt: true,
      },
    });
  }
}
