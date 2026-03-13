import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

interface BnetTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface BnetUserInfo {
  sub: string;
  battletag: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bnetTokenUrl = 'https://oauth.battle.net/token';
  private readonly bnetUserInfoUrl = 'https://oauth.battle.net/userinfo';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async exchangeCode(code: string, redirectUri: string) {
    const clientId = this.configService.getOrThrow<string>('BNET_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('BNET_CLIENT_SECRET');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(this.bnetTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      this.logger.error(`Battle.net token exchange failed: ${response.status}`);
      throw new UnauthorizedException('Failed to exchange authorization code');
    }

    return (await response.json()) as BnetTokenResponse;
  }

  async getUserInfo(accessToken: string): Promise<BnetUserInfo> {
    const response = await fetch(this.bnetUserInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch Battle.net user info');
    }

    return (await response.json()) as BnetUserInfo;
  }

  async upsertUser(battleTag: string, battleNetId: string) {
    return this.prisma.user.upsert({
      where: { battleNetId },
      update: { battleTag },
      create: { battleTag, battleNetId },
    });
  }

  async generateTokens(userId: string) {
    const expiration = this.configService.get<string>('JWT_EXPIRATION', '7d');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, type: 'access' },
        { expiresIn: expiration },
      ),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' },
        { expiresIn: '30d' },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiration,
    };
  }

  async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; type: string }>(token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async registerClientSecret(userId: string, secret: string) {
    const hash = await bcrypt.hash(secret, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { clientSecret: hash },
    });
  }

  async verifyClientSecret(userId: string, secret: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { clientSecret: true },
    });
    if (!user?.clientSecret) {
      return false;
    }
    return bcrypt.compare(secret, user.clientSecret);
  }
}
