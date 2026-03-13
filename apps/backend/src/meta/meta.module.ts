import { Module } from '@nestjs/common';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { MetaAggregationProcessor } from './meta-aggregation.processor';

@Module({
  controllers: [MetaController],
  providers: [MetaService, MetaAggregationProcessor],
  exports: [MetaService],
})
export class MetaModule {}
