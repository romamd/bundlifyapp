import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';

@Injectable()
export class OrdersCreateHandler {
  private readonly logger = new Logger(OrdersCreateHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(shopDomain: string, payload: any) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    if (!shop) {
      this.logger.warn(`Shop not found: ${shopDomain}`);
      return;
    }

    const lineItems: any[] = payload.line_items || [];

    for (const lineItem of lineItems) {
      const shopifyProductId = String(lineItem.product_id);
      const shopifyVariantId = lineItem.variant_id
        ? String(lineItem.variant_id)
        : null;

      const product = await this.prisma.product.findFirst({
        where: {
          shopId: shop.id,
          shopifyProductId,
          ...(shopifyVariantId && { shopifyVariantId }),
        },
      });

      if (!product) {
        this.logger.debug(
          `Product ${shopifyProductId} (variant ${shopifyVariantId}) not found for shop ${shopDomain}`,
        );
        continue;
      }

      const now = new Date();
      const createdAt = new Date(product.createdAt);
      const daysSinceCreated = Math.max(
        1,
        Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const currentAvgDailySales = Number(product.avgDailySales);
      const totalSold =
        currentAvgDailySales * daysSinceCreated + (lineItem.quantity || 1);
      const newAvgDailySales = totalSold / daysSinceCreated;

      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          lastSoldAt: now,
          avgDailySales: newAvgDailySales,
          daysWithoutSale: 0,
        },
      });

      this.logger.debug(
        `Updated sales velocity for product ${product.id}: avgDailySales=${newAvgDailySales.toFixed(4)}`,
      );
    }

    this.logger.log(
      `Order ${payload.id} created for shop ${shopDomain} - processed ${lineItems.length} line items`,
    );
  }
}
