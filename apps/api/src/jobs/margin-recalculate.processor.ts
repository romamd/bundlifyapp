import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';
import { MarginService } from '../modules/margin/margin.service';

@Processor('margin-recalculate')
export class MarginRecalculateProcessor extends WorkerHost {
  private readonly logger = new Logger(MarginRecalculateProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marginService: MarginService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting margin recalculation for all active shops');

    const shops = await this.prisma.shop.findMany({
      where: { uninstalledAt: null },
    });

    this.logger.log(`Found ${shops.length} active shops for margin recalculation`);

    for (const shop of shops) {
      try {
        await this.marginService.recalculateAllMargins(shop.id);
        this.logger.log(`Margin recalculation completed for ${shop.shopifyDomain}`);
      } catch (error) {
        this.logger.error(
          `Margin recalculation failed for ${shop.shopifyDomain}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Margin recalculation completed for all shops');
  }
}
