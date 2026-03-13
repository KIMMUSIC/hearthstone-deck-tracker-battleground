import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MetaController (e2e)', () => {
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

  describe('GET /api/meta/heroes', () => {
    it('should return hero meta stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/meta/heroes')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.heroes).toBeDefined();
      expect(Array.isArray(response.body.data.heroes)).toBe(true);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should filter by game mode', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/meta/heroes?gameMode=SOLO')
        .expect(200);

      expect(response.body.data.heroes).toBeDefined();
    });

    it('should filter by MMR bracket', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/meta/heroes?mmrBracket=6000-8000')
        .expect(200);

      expect(response.body.data.heroes).toBeDefined();
    });

    it('should filter by days', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/meta/heroes?days=30')
        .expect(200);

      expect(response.body.data.heroes).toBeDefined();
    });
  });

  describe('GET /api/meta/tribes', () => {
    it('should return tribe stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/meta/tribes')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by game mode', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/meta/tribes?gameMode=SOLO')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
