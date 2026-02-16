import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';

@Injectable()
export class AppUninstalledHandler {
  private readonly logger = new Logger(AppUninstalledHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(shopDomain: string) {
    await this.prisma.shop.update({
      where: { shopifyDomain: shopDomain },
      data: { uninstalledAt: new Date() },
    });

    await this.prisma.webhookSubscription.deleteMany({
      where: { shop: { shopifyDomain: shopDomain } },
    });

    this.logger.log(`Shop ${shopDomain} uninstalled`);
  }
}
