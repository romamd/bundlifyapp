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

  async getThemeSettings(shopDomain: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
      include: { settings: true },
    });

    if (!shop || shop.uninstalledAt) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    const s = shop.settings;

    return {
      primaryColor: s?.widgetPrimaryColor ?? '#2563eb',
      primaryColorHover: s?.widgetPrimaryColorHover ?? '#1d4ed8',
      textColor: s?.widgetTextColor ?? '#111827',
      cardBackground: s?.widgetCardBackground ?? '#ffffff',
      badgeBackground: s?.widgetBadgeBackground ?? '#dcfce7',
      badgeTextColor: s?.widgetBadgeTextColor ?? '#166534',
      borderRadius: s?.widgetBorderRadius ?? 10,
      buttonText: s?.widgetButtonText ?? 'Add Bundle to Cart',
      layout: s?.widgetLayout ?? 'vertical',
      customCss: s?.widgetCustomCss ?? null,
      fontSize: s?.widgetFontSize ?? 14,
      fontWeight: s?.widgetFontWeight ?? 'normal',
      borderColor: s?.widgetBorderColor ?? '#e5e7eb',
      secondaryTextColor: s?.widgetSecondaryTextColor ?? '#6b7280',
      showSavings: s?.widgetShowSavings ?? true,
      showCompareAtPrice: s?.widgetShowCompareAtPrice ?? true,
      cardShadow: s?.widgetCardShadow ?? 'subtle',
      blockTitleFontSize: s?.widgetBlockTitleFontSize ?? 18,
      blockTitleFontWeight: s?.widgetBlockTitleFontWeight ?? 'bold',
      itemTitleFontSize: s?.widgetItemTitleFontSize ?? 14,
      itemTitleFontWeight: s?.widgetItemTitleFontWeight ?? 'normal',
      subtitleFontSize: s?.widgetSubtitleFontSize ?? 13,
      subtitleFontWeight: s?.widgetSubtitleFontWeight ?? 'normal',
      priceFontSize: s?.widgetPriceFontSize ?? 16,
      priceFontWeight: s?.widgetPriceFontWeight ?? 'bold',
      badgeFontSize: s?.widgetBadgeFontSize ?? 12,
      badgeFontWeight: s?.widgetBadgeFontWeight ?? 'bold',
      buttonFontSize: s?.widgetButtonFontSize ?? 14,
      buttonFontWeight: s?.widgetButtonFontWeight ?? 'bold',
      selectedBgColor: s?.widgetSelectedBgColor ?? '#eff6ff',
      blockTitleColor: s?.widgetBlockTitleColor ?? '#111827',
      titleColor: s?.widgetTitleColor ?? '#111827',
      subtitleColor: s?.widgetSubtitleColor ?? '#6b7280',
      priceColor: s?.widgetPriceColor ?? '#111827',
      originalPriceColor: s?.widgetOriginalPriceColor ?? '#9ca3af',
      labelBgColor: s?.widgetLabelBgColor ?? '#e0e7ff',
      labelTextColor: s?.widgetLabelTextColor ?? '#3730a3',
      buttonTextColor: s?.widgetButtonTextColor ?? '#ffffff',
      savingsBadgeBgColor: s?.widgetSavingsBadgeBgColor ?? '#dcfce7',
      savingsBadgeTextColor: s?.widgetSavingsBadgeTextColor ?? '#166534',
      cardHoverBgColor: s?.widgetCardHoverBgColor ?? '#f9fafb',
    };
  }

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

    // Server-side gate: block exit-intent bundles when disabled in settings
    if (trigger && trigger.toUpperCase() === 'EXIT_INTENT') {
      const settings = await this.prisma.shopSettings.findUnique({
        where: { shopId: shop.id },
      });
      if (!settings || !settings.exitIntentEnabled) {
        return [];
      }
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
        volumeTiers: {
          orderBy: { minQuantity: 'asc' },
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

      const dto: any = {
        bundleId: bundle.id,
        name: bundle.name,
        type: bundle.type,
        discountType: bundle.discountType,
        bundlePrice,
        individualTotal,
        savingsAmount: individualTotal - bundlePrice,
        savingsPct,
        countdownEnabled: bundle.countdownEnabled,
        countdownType: bundle.countdownType,
        countdownDuration: bundle.countdownDuration,
        countdownEndDate: bundle.countdownEndDate?.toISOString() ?? null,
        countdownTitle: bundle.countdownTitle ?? 'Offer expires in {{timer}}',
        countdownBgColor: bundle.countdownBgColor,
        countdownTextColor: bundle.countdownTextColor,
        items: bundle.items.map((item) => ({
          shopifyProductId: item.product.shopifyProductId,
          shopifyVariantId: item.product.shopifyVariantId,
          title: item.product.title,
          variantTitle: item.product.variantTitle,
          price: Number(item.product.price),
          compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
          imageUrl: item.product.imageUrl,
          quantity: item.quantity,
          isAnchor: item.isAnchor,
        })),
        bogoGetQuantity: bundle.bogoGetQuantity ?? null,
        bogoGetDiscountPct: bundle.bogoGetDiscountPct
          ? Number(bundle.bogoGetDiscountPct)
          : null,
        abTestId,
        abVariant,
      };

      if ((bundle as any).volumeTiers && (bundle as any).volumeTiers.length > 0) {
        dto.volumeTiers = (bundle as any).volumeTiers.map((tier: any) => ({
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          discountPct: Number(tier.discountPct),
          pricePerUnit: tier.pricePerUnit != null ? Number(tier.pricePerUnit) : null,
          label: tier.label,
        }));
      }

      results.push(dto);
    }

    return results;
  }

  async getCartDrawerData(
    shopDomain: string,
    cartValue: number,
    productIdsInCart: string[],
    sessionId?: string,
  ) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
      include: { settings: true },
    });

    if (!shop || shop.uninstalledAt) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    const settings = shop.settings;
    if (!settings || !settings.cartDrawerEnabled) {
      return { enabled: false, freeShippingThreshold: null, bundles: [] };
    }

    // Fetch CART_PAGE bundles, exclude those fully in cart, limit 3
    const bundles = await this.getBundlesForStorefront(
      shopDomain,
      undefined,
      'CART_PAGE',
      sessionId,
    );

    const filteredBundles = bundles
      .filter((bundle) => {
        // Exclude bundles whose items are all already in the cart
        const allInCart = bundle.items.every((item) =>
          productIdsInCart.includes(item.shopifyProductId),
        );
        return !allInCart;
      })
      .slice(0, 3);

    return {
      enabled: true,
      freeShippingThreshold: settings.freeShippingThreshold
        ? Number(settings.freeShippingThreshold)
        : null,
      bundles: filteredBundles,
    };
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
