import {
  Body,
  Controller,
  Post,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { HmacVerifyGuard } from './guards/hmac-verify.guard';
import { MatchRateLimitGuard } from './guards/match-rate-limit.guard';
import { MmrGateway } from '../websocket/mmr.gateway';

@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly mmrGateway: MmrGateway,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, HmacVerifyGuard, MatchRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  async createMatch(
    @CurrentUser() user: { userId: string; battleTag: string },
    @Headers('x-client-signature') signature: string,
    @Body() dto: CreateMatchDto,
  ) {
    const match = await this.matchesService.createMatch(user.userId, dto, signature);

    this.mmrGateway.broadcastMmrUpdate(user.battleTag, {
      mmr: dto.matchData.mmrAfter,
      matchId: match.id,
      placement: dto.matchData.placement,
      heroCardId: dto.matchData.heroCardId,
    });

    return { matchId: match.id };
  }
}
