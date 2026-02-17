import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import type { StorefrontBundleDto, TrackEventDto } from '@bundlify/shared-types';

@Injectable()
export class StorefrontService {
  private readonly logger = new Logger(StorefrontService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBundlesForStorefront(
    shopDomain: string,
    productId?: string,
    trigger?: string,
  ): Promise<StorefrontBundleDto[]> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    if (!shop || shop.uninstalledAt) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    const now = new Date();

    const bundles = await this.prisma.bundle.findMany({
      where: {
        shopId: shop.id,
        status: 'ACTIVE',
        ...(trigger && { triggerType: trigger as any }),
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        displayRules: true,
      },
      orderBy: [
        { displayPriority: 'desc' },
        { contributionMarginPct: 'desc' },
      ],
    });

    // Filter out expired bundles
    const activeBundles = bundles.filter(
      (b) => !b.endsAt || new Date(b.endsAt) >= now,
    );

    // Filter by productId if specified
    const filteredBundles = productId
      ? activeBundles.filter((bundle) => {
          const hasDisplayRule = bundle.displayRules.some(
            (rule) =>
              rule.targetType === 'PRODUCT' && rule.targetId === productId,
          );
          const hasItemWithProduct = bundle.items.some(
            (item) => item.product.shopifyProductId === productId,
          );
          return hasDisplayRule || hasItemWithProduct;
        })
      : activeBundles;

    return filteredBundles.map((bundle) => ({
      bundleId: bundle.id,
      name: bundle.name,
      bundlePrice: Number(bundle.bundlePrice),
      individualTotal: Number(bundle.individualTotal),
      savingsAmount: Number(bundle.individualTotal) - Number(bundle.bundlePrice),
      savingsPct: Number(bundle.discountPct),
      items: bundle.items.map((item) => ({
        shopifyProductId: item.product.shopifyProductId,
        shopifyVariantId: item.product.shopifyVariantId,
        title: item.product.title,
        variantTitle: item.product.variantTitle,
        price: Number(item.product.price),
        imageUrl: item.product.imageUrl,
        quantity: item.quantity,
        isAnchor: item.isAnchor,
      })),
    }));
  }

  async trackEvent(shopDomain: string, data: TrackEventDto): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    if (!shop || shop.uninstalledAt) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    await this.prisma.bundleView.create({
      data: {
        shopId: shop.id,
        bundleId: data.bundleId,
        event: data.event as any,
        sessionId: data.sessionId || null,
        triggerType: data.triggerType as any,
        pageUrl: data.pageUrl || null,
        cartValue: data.cartValue ?? null,
        orderId: data.orderId || null,
        revenue: data.revenue ?? null,
      },
    });

    this.logger.debug(
      `Tracked ${data.event} for bundle ${data.bundleId} in shop ${shopDomain}`,
    );
  }
}
