import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

function createSignature(body: unknown, timestamp: number, secret: string): string {
  const sorted = sortObjectKeys(body);
  const payload = JSON.stringify(sorted) + String(timestamp);
  return createHmac('sha256', secret).update(payload).digest('hex');
}

const sampleMatchPayload = {
  matchData: {
    gameMode: 'SOLO',
    heroCardId: 'BG_HERO_01',
    placement: 1,
    mmrBefore: 5000,
    mmrAfter: 5100,
    turnCount: 12,
    anomalyCardId: null,
    availableRaces: [1, 2, 3, 4, 5],
    startedAt: '2025-01-01T00:00:00.000Z',
    endedAt: '2025-01-01T00:30:00.000Z',
  },
  opponents: [
    {
      playerIdInGame: 2,
      heroCardId: 'BG_HERO_02',
      tavernTier: 5,
      lastKnownBoard: [],
      damageDealt: 10,
      damageTaken: 5,
    },
  ],
  turns: [
    {
      turnNumber: 1,
      tavernTier: 1,
      health: 40,
      boardState: [],
      combatResult: 'WIN',
      damageDelta: 3,
      timestamp: '2025-01-01T00:02:00.000Z',
    },
  ],
};

describe('MatchesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/matches', () => {
    it('should reject without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/matches')
        .send(sampleMatchPayload)
        .expect(401);
    });

    it('should reject without HMAC signature', () => {
      return request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', 'Bearer fake-token')
        .send(sampleMatchPayload)
        .expect(401);
    });

    it('should reject with expired timestamp', () => {
      const expiredTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      return request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', 'Bearer fake-token')
        .set('X-Client-Signature', 'fake-signature')
        .set('X-Timestamp', String(expiredTimestamp))
        .send(sampleMatchPayload)
        .expect(401);
    });

    it('should reject invalid placement value', () => {
      const invalidPayload = {
        ...sampleMatchPayload,
        matchData: { ...sampleMatchPayload.matchData, placement: 9 },
      };
      return request(app.getHttpServer())
        .post('/api/matches')
        .send(invalidPayload)
        .expect(401);
    });

    it('should reject empty body', () => {
      return request(app.getHttpServer())
        .post('/api/matches')
        .send({})
        .expect(401);
    });
  });
});
