import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import type { StorefrontBundleDto, TrackEventDto } from '@bundlify/shared-types';
import { ABTestingService } from '../ab-testing/ab-testing.service';

@Injectable()
export class StorefrontService {
  private readonly logger = new Logger(StorefrontService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abTestingService: ABTestingService,
  ) {}

  async getBundlesForStorefront(
    shopDomain: string,
    productId?: string,
    trigger?: string,
    sessionId?: string,
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
        ...(trigger && { triggerType: trigger.toUpperCase() as any }),
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
    // Bundles with no display rules are shown on ALL products
    const filteredBundles = productId
      ? activeBundles.filter((bundle) => {
          if (bundle.displayRules.length === 0) return true;
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

    const results: StorefrontBundleDto[] = [];

    for (const bundle of filteredBundles) {
      let bundlePrice = Number(bundle.bundlePrice);
      let savingsPct = Number(bundle.discountPct);
      let abTestId: string | undefined;
      let abVariant: 'control' | 'variant' | undefined;

      // Check if this bundle has an active A/B test
      if (bundle.abTestId && sessionId) {
        try {
          const test = await this.prisma.aBTest.findFirst({
            where: { id: bundle.abTestId, status: 'RUNNING' },
          });

          if (test) {
            abTestId = test.id;
            abVariant = this.abTestingService.assignVariant(test.id, sessionId);

            // If variant, recalculate price using variant discount
            if (abVariant === 'variant') {
              const individualTotal = Number(bundle.individualTotal);
              savingsPct = Number(test.variantDiscountPct);
              bundlePrice = individualTotal * (1 - savingsPct / 100);
            }

            // Record impression asynchronously (fire and forget)
            this.abTestingService
              .recordMetric(test.id, abVariant, 'impression')
              .catch((err) =>
                this.logger.error(`Failed to record A/B test impression: ${err.message}`),
              );
          }
        } catch (err: any) {
          this.logger.error(`Error processing A/B test for bundle ${bundle.id}: ${err.message}`);
        }
      }

      const individualTotal = Number(bundle.individualTotal);

      results.push({
        bundleId: bundle.id,
        name: bundle.name,
        bundlePrice,
        individualTotal,
        savingsAmount: individualTotal - bundlePrice,
        savingsPct,
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
        abTestId,
        abVariant,
      });
    }

    return results;
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
        triggerType: (data.triggerType?.toUpperCase() || 'PRODUCT_PAGE') as any,
        pageUrl: data.pageUrl || null,
        cartValue: data.cartValue ?? null,
        orderId: data.orderId || null,
        revenue: data.revenue ?? null,
        abTestId: data.abTestId || null,
        abVariant: data.abVariant || null,
      },
    });

    // Record A/B test conversion metrics for purchase events
    if (
      data.abTestId &&
      data.abVariant &&
      (data.event === 'PURCHASE' || data.event === 'ADD_TO_CART')
    ) {
      const variant = data.abVariant as 'control' | 'variant';
      this.abTestingService
        .recordMetric(data.abTestId, variant, 'conversion', data.revenue)
        .catch((err) =>
          this.logger.error(`Failed to record A/B test conversion: ${err.message}`),
        );
    }

    this.logger.debug(
      `Tracked ${data.event} for bundle ${data.bundleId} in shop ${shopDomain}`,
    );
  }
}
