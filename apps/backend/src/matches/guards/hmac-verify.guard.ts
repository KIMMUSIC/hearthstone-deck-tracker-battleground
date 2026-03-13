import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000;

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

@Injectable()
export class HmacVerifyGuard implements CanActivate {
  private readonly logger = new Logger(HmacVerifyGuard.name);

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-client-signature'] as string;
    const timestampStr = request.headers['x-timestamp'] as string;

    if (!signature || !timestampStr) {
      throw new BadRequestException('Missing signature or timestamp headers');
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      throw new BadRequestException('Invalid timestamp');
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > TIMESTAMP_WINDOW_MS) {
      throw new BadRequestException('Timestamp expired');
    }

    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { clientSecret: true },
    });

    if (!user?.clientSecret) {
      throw new UnauthorizedException('Client secret not registered');
    }

    const body = sortObjectKeys(request.body);
    const payload = JSON.stringify(body) + timestampStr;
    const expectedSignature = createHmac('sha256', user.clientSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      this.logger.warn(`HMAC verification failed for user ${userId}`);
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
