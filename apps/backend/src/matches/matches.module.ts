import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { HmacVerifyGuard } from './guards/hmac-verify.guard';
import { MatchRateLimitGuard } from './guards/match-rate-limit.guard';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  controllers: [MatchesController],
  providers: [MatchesService, HmacVerifyGuard, MatchRateLimitGuard],
  exports: [MatchesService],
})
export class MatchesModule {}
