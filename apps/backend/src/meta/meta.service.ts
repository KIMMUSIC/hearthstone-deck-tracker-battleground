import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { getMmrBracketFilter } from './types/mmr-bracket';

@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getHeroStats(gameMode?: string, mmrBracket?: string, days: number = 7) {
    const cacheKey = `meta:heroes:${gameMode ?? 'all'}:${mmrBracket ?? 'all'}:${days}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Record<string, unknown> = {
      startedAt: { gte: since },
    };
    if (gameMode) where.gameMode = gameMode;

    const mmrFilter = getMmrBracketFilter(mmrBracket);
    if (mmrFilter.mmrBefore) where.mmrBefore = mmrFilter.mmrBefore;

    const heroGroups = await this.prisma.match.groupBy({
      by: ['heroCardId'],
      where,
      _count: { heroCardId: true },
      _avg: { placement: true },
    });

    const totalGames = heroGroups.reduce((sum, h) => sum + h._count.heroCardId, 0);

    // Get top4 counts per hero
    const heroStats = await Promise.all(
      heroGroups.map(async (hero) => {
        const heroWhere = { ...where, heroCardId: hero.heroCardId };
        const top4Count = await this.prisma.match.count({
          where: { ...heroWhere, placement: { lte: 4 } },
        });

        return {
          heroCardId: hero.heroCardId,
          pickCount: hero._count.heroCardId,
          avgPlacement: Math.round((hero._avg.placement ?? 0) * 100) / 100,
          top4Rate: hero._count.heroCardId > 0
            ? Math.round((top4Count / hero._count.heroCardId) * 10000) / 10000
            : 0,
          gamesPlayed: hero._count.heroCardId,
        };
      }),
    );

    heroStats.sort((a, b) => a.avgPlacement - b.avgPlacement);

    const result = {
      heroes: heroStats,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 600); // 10 min TTL
    return result;
  }

  async getTribeStats(gameMode?: string, days: number = 7) {
    const cacheKey = `meta:tribes:${gameMode ?? 'all'}:${days}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Record<string, unknown> = {
      startedAt: { gte: since },
    };
    if (gameMode) where.gameMode = gameMode;

    const matches = await this.prisma.match.findMany({
      where,
      select: { availableRaces: true, placement: true },
    });

    const tribeMap = new Map<number, { count: number; totalPlacement: number }>();

    for (const match of matches) {
      for (const race of match.availableRaces) {
        const entry = tribeMap.get(race) ?? { count: 0, totalPlacement: 0 };
        entry.count++;
        entry.totalPlacement += match.placement;
        tribeMap.set(race, entry);
      }
    }

    const totalGames = matches.length;
    const tribeStats = Array.from(tribeMap.entries()).map(([raceId, data]) => ({
      raceId,
      appearanceRate: totalGames > 0 ? Math.round((data.count / totalGames) * 10000) / 10000 : 0,
      avgPlacement: data.count > 0 ? Math.round((data.totalPlacement / data.count) * 100) / 100 : 0,
      gamesWithTribe: data.count,
    }));

    tribeStats.sort((a, b) => a.avgPlacement - b.avgPlacement);

    await this.redis.set(cacheKey, JSON.stringify(tribeStats), 'EX', 600);
    return tribeStats;
  }

  async invalidateHeroStatsCache() {
    const keys = await this.redis.keys('meta:heroes:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
