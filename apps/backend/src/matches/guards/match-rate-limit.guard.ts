import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_MATCHES = 2;

@Injectable()
export class MatchRateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) return false;

    const key = `match-rate:${userId}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Remove expired entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count entries in window
    const count = await this.redis.zcard(key);
    if (count >= MAX_MATCHES) {
      throw new HttpException(
        'Too many match uploads. Maximum 2 matches per 10 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current request
    await this.redis.zadd(key, now, `${now}`);
    await this.redis.expire(key, Math.ceil(WINDOW_MS / 1000));

    return true;
  }
}
