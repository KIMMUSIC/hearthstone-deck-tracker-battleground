import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MetaService } from './meta.service';

@Injectable()
export class MetaAggregationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetaAggregationProcessor.name);
  private aggregationInterval: ReturnType<typeof setInterval> | null = null;
  private dailyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private metaService: MetaService) {}

  onModuleInit() {
    // Run aggregation every 10 minutes
    this.aggregationInterval = setInterval(
      () => this.handleHeroStatsAggregation(),
      10 * 60 * 1000,
    );

    // Schedule daily rollup
    this.scheduleDailyRollup();

    // Initial warm-up after 30 seconds
    setTimeout(() => this.handleHeroStatsAggregation(), 30_000);
  }

  onModuleDestroy() {
    if (this.aggregationInterval) clearInterval(this.aggregationInterval);
    if (this.dailyTimeout) clearTimeout(this.dailyTimeout);
  }

  private scheduleDailyRollup() {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(0, 5, 0, 0); // 00:05 UTC
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();

    this.dailyTimeout = setTimeout(() => {
      this.handleDailyRollup();
      // Re-schedule for next day
      this.scheduleDailyRollup();
    }, delay);
  }

  private async handleHeroStatsAggregation() {
    this.logger.log('Running hero stats aggregation...');
    try {
      await this.metaService.invalidateHeroStatsCache();
      await Promise.all([
        this.metaService.getHeroStats(undefined, undefined, 7),
        this.metaService.getHeroStats('SOLO', undefined, 7),
        this.metaService.getHeroStats('DUOS', undefined, 7),
      ]);
      this.logger.log('Hero stats aggregation complete');
    } catch (error) {
      this.logger.error('Hero stats aggregation failed', error);
    }
  }

  private async handleDailyRollup() {
    this.logger.log('Running daily meta stats rollup...');
    try {
      await this.metaService.invalidateHeroStatsCache();
      this.logger.log('Daily rollup complete');
    } catch (error) {
      this.logger.error('Daily rollup failed', error);
    }
  }
}
