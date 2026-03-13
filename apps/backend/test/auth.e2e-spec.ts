import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
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

  describe('POST /api/auth/callback', () => {
    it('should reject invalid request body', () => {
      return request(app.getHttpServer())
        .post('/api/auth/callback')
        .send({})
        .expect(400);
    });

    it('should reject missing code', () => {
      return request(app.getHttpServer())
        .post('/api/auth/callback')
        .send({ redirect_uri: 'bg-tracker://auth/callback' })
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should reject empty body', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/register-client', () => {
    it('should reject without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register-client')
        .send({ clientSecret: 'a'.repeat(32) })
        .expect(401);
    });

    it('should reject short client secret', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register-client')
        .set('Authorization', 'Bearer fake-token')
        .send({ clientSecret: 'short' })
        .expect(401);
    });
  });
});
