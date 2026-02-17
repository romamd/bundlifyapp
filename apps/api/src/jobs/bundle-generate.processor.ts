import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';
import { BundleEngineService } from '../modules/bundles/bundle-engine.service';

@Processor('bundle-generate')
export class BundleGenerateProcessor extends WorkerHost {
  private readonly logger = new Logger(BundleGenerateProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bundleEngineService: BundleEngineService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting bundle generation for all active shops');

    const shops = await this.prisma.shop.findMany({
      where: { uninstalledAt: null },
    });

    this.logger.log(`Found ${shops.length} active shops for bundle generation`);

    for (const shop of shops) {
      try {
        const count = await this.bundleEngineService.generateBundles(shop.id);
        this.logger.log(
          `Generated ${count} bundles for ${shop.shopifyDomain}`,
        );
      } catch (error) {
        this.logger.error(
          `Bundle generation failed for ${shop.shopifyDomain}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Bundle generation completed for all shops');
  }
}
