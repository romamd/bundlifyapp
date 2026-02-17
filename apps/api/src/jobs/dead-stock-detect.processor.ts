import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';

@Processor('dead-stock-detect')
export class DeadStockDetectProcessor extends WorkerHost {
  private readonly logger = new Logger(DeadStockDetectProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting dead stock detection for all active shops');

    const shops = await this.prisma.shop.findMany({
      where: { uninstalledAt: null },
      include: { settings: true },
    });

    for (const shop of shops) {
      try {
        const threshold = shop.settings?.deadStockDaysThreshold ?? 60;

        const products = await this.prisma.product.findMany({
          where: { shopId: shop.id },
        });

        const now = new Date();

        for (const product of products) {
          const referenceDate = product.lastSoldAt ?? product.createdAt;
          const diffMs = now.getTime() - referenceDate.getTime();
          const daysWithoutSale = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const isDeadStock = daysWithoutSale >= threshold;

          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              daysWithoutSale,
              isDeadStock,
            },
          });
        }

        this.logger.log(
          `Dead stock detection completed for ${shop.shopifyDomain}: ${products.length} products evaluated`,
        );
      } catch (error) {
        this.logger.error(
          `Dead stock detection failed for ${shop.shopifyDomain}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Dead stock detection completed for all shops');
  }
}
