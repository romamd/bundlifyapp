import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';
import { AffinityService } from '../modules/affinity/affinity.service';

@Processor('affinity-calculate')
export class AffinityCalculateProcessor extends WorkerHost {
  private readonly logger = new Logger(AffinityCalculateProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly affinityService: AffinityService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting affinity calculation for all active shops');

    const shops = await this.prisma.shop.findMany({
      where: { uninstalledAt: null },
    });

    for (const shop of shops) {
      try {
        const count = await this.affinityService.calculateAffinities(shop.id);
        this.logger.log(
          `Affinity calculation for ${shop.shopifyDomain}: ${count} pairs`,
        );
      } catch (error) {
        this.logger.error(
          `Affinity calculation failed for ${shop.shopifyDomain}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Affinity calculation completed for all shops');
  }
}
