import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UsersController (e2e)', () => {
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

  describe('GET /api/users/:battletag', () => {
    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/users/NonExistent-9999')
        .expect(404);
    });

    it('should return user profile when user exists', async () => {
      // Seed a test user
      const user = await prisma.user.create({
        data: {
          battleTag: 'TestPlayer#1234',
          battleNetId: 'test-bnet-id-users',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/users/TestPlayer-1234')
        .expect(200);

      expect(response.body.data.profile.battleTag).toBe('TestPlayer#1234');
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalGames).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('GET /api/users/:battletag/matches', () => {
    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/users/Nobody-0000/matches')
        .expect(404);
    });

    it('should return paginated match history', async () => {
      const user = await prisma.user.create({
        data: {
          battleTag: 'MatchUser#5678',
          battleNetId: 'test-bnet-match-history',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/users/MatchUser-5678/matches?page=1&pageSize=10')
        .expect(200);

      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.total).toBe(0);

      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('GET /api/users/:battletag/mmr', () => {
    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/users/Ghost-0000/mmr')
        .expect(404);
    });

    it('should return empty MMR history for new user', async () => {
      const user = await prisma.user.create({
        data: {
          battleTag: 'MmrUser#9012',
          battleNetId: 'test-bnet-mmr',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/users/MmrUser-9012/mmr')
        .expect(200);

      expect(response.body.data).toEqual([]);

      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
