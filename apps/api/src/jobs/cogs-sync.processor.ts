import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';
import { IntegrationsService } from '../modules/integrations/integrations.service';

@Processor('cogs-sync')
export class CogsSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CogsSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting scheduled COGS sync for all integrations');

    const integrations = await this.prisma.integration.findMany({
      where: { status: 'CONNECTED' },
      include: { shop: true },
    });

    for (const integration of integrations) {
      try {
        const result = await this.integrationsService.syncCogs(
          integration.shopId,
          integration.provider.toLowerCase(),
        );
        this.logger.log(
          `COGS sync for ${integration.shop.shopifyDomain} (${integration.provider}): ${result.matched} matched, ${result.unmatched} unmatched`,
        );
      } catch (error) {
        this.logger.error(
          `COGS sync failed for ${integration.shop.shopifyDomain} (${integration.provider}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Scheduled COGS sync completed');
  }
}
