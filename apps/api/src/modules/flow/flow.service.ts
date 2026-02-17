import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async fireTrigger(
    shopId: string,
    trigger: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      const shop = await this.prisma.shop.findUniqueOrThrow({
        where: { id: shopId },
      });

      const accessToken = await this.authService.getDecryptedAccessToken(shopId);

      const response = await fetch(
        `https://${shop.shopifyDomain}/admin/api/2025-01/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({
            query: `
              mutation flowTriggerReceive($body: String!) {
                flowTriggerReceive(body: $body) {
                  userErrors {
                    field
                    message
                  }
                }
              }
            `,
            variables: {
              body: JSON.stringify({
                trigger_type: trigger,
                ...payload,
              }),
            },
          }),
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `Flow trigger ${trigger} failed for shop ${shop.shopifyDomain}: ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Flow trigger ${trigger} failed for shop ${shopId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async activateBundle(shopDomain: string, bundleId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
    });
    if (!shop) return;

    await this.prisma.bundle.updateMany({
      where: { id: bundleId, shopId: shop.id },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(`Flow action: activated bundle ${bundleId} for ${shopDomain}`);
  }

  async pauseBundle(shopDomain: string, bundleId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
    });
    if (!shop) return;

    await this.prisma.bundle.updateMany({
      where: { id: bundleId, shopId: shop.id },
      data: { status: 'PAUSED' },
    });

    this.logger.log(`Flow action: paused bundle ${bundleId} for ${shopDomain}`);
  }

  async generateBundles(shopDomain: string): Promise<void> {
    // This just marks the request — the actual generation happens via the existing BullMQ processor
    this.logger.log(`Flow action: generate bundles requested for ${shopDomain}`);
  }
}
