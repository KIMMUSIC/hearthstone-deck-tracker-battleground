import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CombatResult, GameMode } from '@prisma/client';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(private prisma: PrismaService) {}

  async isDuplicate(userId: string, startedAt: string, heroCardId: string): Promise<boolean> {
    const existing = await this.prisma.match.findFirst({
      where: {
        userId,
        startedAt: new Date(startedAt),
        heroCardId,
      },
    });
    return !!existing;
  }

  async createMatch(userId: string, dto: CreateMatchDto, signature: string) {
    const { matchData, opponents, turns } = dto;

    if (await this.isDuplicate(userId, matchData.startedAt, matchData.heroCardId)) {
      throw new ConflictException('Duplicate match');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const match = await tx.match.create({
        data: {
          userId,
          gameMode: matchData.gameMode as GameMode,
          heroCardId: matchData.heroCardId,
          placement: matchData.placement,
          mmrBefore: matchData.mmrBefore,
          mmrAfter: matchData.mmrAfter,
          turnCount: matchData.turnCount,
          anomalyCardId: matchData.anomalyCardId,
          availableRaces: matchData.availableRaces,
          startedAt: new Date(matchData.startedAt),
          endedAt: new Date(matchData.endedAt),
          clientSignature: signature,
          opponents: {
            create: opponents.map((opp) => ({
              playerIdInGame: opp.playerIdInGame,
              heroCardId: opp.heroCardId,
              tavernTier: opp.tavernTier,
              lastKnownBoard: opp.lastKnownBoard as any,
              damageDealt: opp.damageDealt,
              damageTaken: opp.damageTaken,
            })),
          },
          turns: {
            create: turns.map((turn) => ({
              turnNumber: turn.turnNumber,
              tavernTier: turn.tavernTier,
              health: turn.health,
              boardState: turn.boardState as any,
              combatResult: turn.combatResult as CombatResult,
              damageDelta: turn.damageDelta,
              timestamp: new Date(turn.timestamp),
            })),
          },
        },
      });

      await tx.mmrHistory.create({
        data: {
          userId,
          gameMode: matchData.gameMode as GameMode,
          mmr: matchData.mmrAfter,
          matchId: match.id,
          recordedAt: new Date(matchData.endedAt),
        },
      });

      return match;
    });

    this.logger.log(`Match created: ${result.id} for user ${userId}`);
    return result;
  }

  async getMatchById(matchId: string) {
    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: { opponents: true, turns: { orderBy: { turnNumber: 'asc' } } },
    });
  }
}
