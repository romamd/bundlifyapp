import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';

@Injectable()
export class OrdersPaidHandler {
  private readonly logger = new Logger(OrdersPaidHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(shopDomain: string, payload: any) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    if (!shop) {
      this.logger.warn(`Shop not found: ${shopDomain}`);
      return;
    }

    const activeBundles = await this.prisma.bundle.findMany({
      where: {
        shopId: shop.id,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const lineItems: any[] = payload.line_items || [];
    const lineItemProductIds = new Set(
      lineItems.map((li: any) => String(li.product_id)),
    );

    for (const bundle of activeBundles) {
      const allItemsPresent = bundle.items.every((item) =>
        lineItemProductIds.has(item.product.shopifyProductId),
      );

      if (!allItemsPresent) {
        continue;
      }

      // Calculate revenue from matched line items
      let revenue = 0;
      for (const item of bundle.items) {
        const matchedLineItem = lineItems.find(
          (li: any) =>
            String(li.product_id) === item.product.shopifyProductId,
        );
        if (matchedLineItem) {
          revenue += parseFloat(matchedLineItem.price) * (matchedLineItem.quantity || 1);
        }
      }

      // Increment redemptions
      await this.prisma.bundle.update({
        where: { id: bundle.id },
        data: {
          currentRedemptions: { increment: 1 },
        },
      });

      // Record purchase event
      await this.prisma.bundleView.create({
        data: {
          shopId: shop.id,
          bundleId: bundle.id,
          event: 'PURCHASED',
          triggerType: bundle.triggerType,
          orderId: payload.id ? String(payload.id) : null,
          revenue,
          margin: bundle.contributionMargin
            ? Number(bundle.contributionMargin)
            : null,
        },
      });

      this.logger.log(
        `Bundle ${bundle.id} (${bundle.name}) redeemed in order ${payload.id} for shop ${shopDomain} - revenue: ${revenue}`,
      );
    }

    this.logger.log(
      `Order ${payload.id} paid for shop ${shopDomain} - checked ${activeBundles.length} bundles`,
    );
  }
}
