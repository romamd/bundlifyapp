import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';
import { ProductsModule } from '../modules/products/products.module';
import { MarginModule } from '../modules/margin/margin.module';
import { BundlesModule } from '../modules/bundles/bundles.module';
import { ProductSyncProcessor } from './product-sync.processor';
import { MarginRecalculateProcessor } from './margin-recalculate.processor';
import { DeadStockDetectProcessor } from './dead-stock-detect.processor';
import { BundleGenerateProcessor } from './bundle-generate.processor';
import { AnalyticsAggregateProcessor } from './analytics-aggregate.processor';
import { CleanupProcessor } from './cleanup.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue(
      { name: 'product-sync' },
      { name: 'margin-recalculate' },
      { name: 'dead-stock-detect' },
      { name: 'bundle-generate' },
      { name: 'analytics-aggregate' },
      { name: 'cleanup' },
    ),
    ProductsModule,
    MarginModule,
    BundlesModule,
  ],
  providers: [
    PrismaService,
    ProductSyncProcessor,
    MarginRecalculateProcessor,
    DeadStockDetectProcessor,
    BundleGenerateProcessor,
    AnalyticsAggregateProcessor,
    CleanupProcessor,
  ],
})
export class JobsModule implements OnModuleInit {
  constructor(
    @InjectQueue('product-sync')
    private readonly productSyncQueue: Queue,
    @InjectQueue('margin-recalculate')
    private readonly marginRecalculateQueue: Queue,
    @InjectQueue('dead-stock-detect')
    private readonly deadStockDetectQueue: Queue,
    @InjectQueue('bundle-generate')
    private readonly bundleGenerateQueue: Queue,
    @InjectQueue('analytics-aggregate')
    private readonly analyticsAggregateQueue: Queue,
    @InjectQueue('cleanup')
    private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    // Product sync: every 6 hours
    await this.productSyncQueue.upsertJobScheduler(
      'product-sync-schedule',
      { pattern: '0 */6 * * *' },
      { name: 'product-sync', data: {} },
    );

    // Margin recalculation: daily at midnight
    await this.marginRecalculateQueue.upsertJobScheduler(
      'margin-recalculate-schedule',
      { pattern: '0 0 * * *' },
      { name: 'margin-recalculate', data: {} },
    );

    // Dead stock detection: daily at 3am
    await this.deadStockDetectQueue.upsertJobScheduler(
      'dead-stock-detect-schedule',
      { pattern: '0 3 * * *' },
      { name: 'dead-stock-detect', data: {} },
    );

    // Bundle generation: daily at 4am
    await this.bundleGenerateQueue.upsertJobScheduler(
      'bundle-generate-schedule',
      { pattern: '0 4 * * *' },
      { name: 'bundle-generate', data: {} },
    );

    // Analytics aggregation: daily at 5am
    await this.analyticsAggregateQueue.upsertJobScheduler(
      'analytics-aggregate-schedule',
      { pattern: '0 5 * * *' },
      { name: 'analytics-aggregate', data: {} },
    );

    // Cleanup: daily at 6am
    await this.cleanupQueue.upsertJobScheduler(
      'cleanup-schedule',
      { pattern: '0 6 * * *' },
      { name: 'cleanup', data: {} },
    );
  }
}
