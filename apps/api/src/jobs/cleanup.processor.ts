import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';

@Processor('cleanup')
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting cleanup of uninstalled shops');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const shops = await this.prisma.shop.findMany({
      where: {
        uninstalledAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Found ${shops.length} shops to clean up`);

    for (const shop of shops) {
      try {
        // Delete in order to respect foreign key constraints
        await this.prisma.bundleView.deleteMany({ where: { shopId: shop.id } });
        await this.prisma.bundleDisplayRule.deleteMany({
          where: { bundle: { shopId: shop.id } },
        });
        await this.prisma.bundleItem.deleteMany({
          where: { bundle: { shopId: shop.id } },
        });
        await this.prisma.bundle.deleteMany({ where: { shopId: shop.id } });
        await this.prisma.product.deleteMany({ where: { shopId: shop.id } });
        await this.prisma.webhookSubscription.deleteMany({ where: { shopId: shop.id } });
        await this.prisma.shopSettings.deleteMany({ where: { shopId: shop.id } });
        await this.prisma.shop.delete({ where: { id: shop.id } });

        this.logger.log(`Cleaned up data for shop ${shop.shopifyDomain}`);
      } catch (error) {
        this.logger.error(
          `Cleanup failed for shop ${shop.shopifyDomain}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Cleanup completed');
  }
}
