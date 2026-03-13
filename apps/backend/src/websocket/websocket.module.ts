import { Module } from '@nestjs/common';
import { MmrGateway } from './mmr.gateway';

@Module({
  providers: [MmrGateway],
  exports: [MmrGateway],
})
export class WebsocketModule {}
