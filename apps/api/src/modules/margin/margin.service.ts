import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import { calculateProductMargin } from '@bundlify/margin-engine';

@Injectable()
export class MarginService {
  private readonly logger = new Logger(MarginService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recalculateProductMargin(
    productId: string,
    shopId: string,
  ): Promise<void> {
    const product = await this.prisma.product.findFirstOrThrow({
      where: { id: productId, shopId },
      include: { shop: true },
    });

    if (product.cogs === null) {
      return;
    }

    const result = calculateProductMargin({
      price: Number(product.price),
      cogs: Number(product.cogs),
      shippingCost: Number(product.shippingCost ?? product.shop.defaultShippingCost),
      additionalCosts: Number(product.additionalCosts ?? 0),
      paymentProcessingPct: Number(product.shop.paymentProcessingPct),
      paymentProcessingFlat: Number(product.shop.paymentProcessingFlat),
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        contributionMargin: result.contributionMargin,
        contributionMarginPct: result.contributionMarginPct,
      },
    });
  }

  async recalculateAllMargins(shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });

    const products = await this.prisma.product.findMany({
      where: { shopId, cogs: { not: null } },
    });

    for (const product of products) {
      const result = calculateProductMargin({
        price: Number(product.price),
        cogs: Number(product.cogs!),
        shippingCost: Number(product.shippingCost ?? shop.defaultShippingCost),
        additionalCosts: Number(product.additionalCosts ?? 0),
        paymentProcessingPct: Number(shop.paymentProcessingPct),
        paymentProcessingFlat: Number(shop.paymentProcessingFlat),
      });

      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          contributionMargin: result.contributionMargin,
          contributionMarginPct: result.contributionMarginPct,
        },
      });
    }

    this.logger.log(
      `Recalculated margins for ${products.length} products in shop ${shopId}`,
    );
  }
}
