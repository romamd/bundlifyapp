import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';
import { ProductsSyncService } from '../modules/products/products-sync.service';

@Processor('product-sync')
export class ProductSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsSyncService: ProductsSyncService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting product sync for all active shops');

    const shops = await this.prisma.shop.findMany({
      where: { uninstalledAt: null },
    });

    this.logger.log(`Found ${shops.length} active shops to sync`);

    for (const shop of shops) {
      try {
        await this.productsSyncService.fullSync(shop);
        this.logger.log(`Product sync completed for ${shop.shopifyDomain}`);
      } catch (error) {
        this.logger.error(
          `Product sync failed for ${shop.shopifyDomain}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Product sync completed for all shops');
  }
}
