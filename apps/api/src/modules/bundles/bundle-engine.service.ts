import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import {
  calculateBundleMargin,
  findOptimalDiscount,
  scoreBundleCandidate,
} from '@bundlify/margin-engine';

interface GeneratedBundleCandidate {
  anchorId: string;
  companionIds: string[];
  discountPct: number;
  score: number;
  marginResult: {
    effectivePrice: number;
    processingFee: number;
    contributionMargin: number;
    contributionMarginPct: number;
  };
  items: Array<{
    productId: string;
    price: number;
    cogs: number;
    shippingCost: number;
    additionalCosts: number;
    quantity: number;
    isAnchor: boolean;
    isDeadStock: boolean;
    daysWithoutSale: number;
    title: string;
  }>;
}

@Injectable()
export class BundleEngineService {
  private readonly logger = new Logger(BundleEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateBundles(shopId: string): Promise<number> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
      include: { settings: true },
    });

    const settings = shop.settings;
    if (!settings?.autoGenerateBundles) {
      this.logger.log(
        `Auto-generate bundles is disabled for shop ${shop.shopifyDomain}`,
      );
      return 0;
    }

    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        status: 'ACTIVE',
        cogs: { not: null },
      },
    });

    if (products.length < 2) {
      this.logger.log(
        `Not enough products with COGS for shop ${shop.shopifyDomain}`,
      );
      return 0;
    }

    // Sort by avgDailySales descending to identify bestsellers
    const sortedBySales = [...products].sort(
      (a, b) => Number(b.avgDailySales) - Number(a.avgDailySales),
    );

    const bestsellerCount = Math.max(1, Math.ceil(products.length * 0.2));
    const bestsellers = sortedBySales.slice(0, bestsellerCount);

    const deadStockProducts = settings.includeDeadStock
      ? products.filter(
          (p) => p.isDeadStock && p.inventoryQuantity > 0,
        )
      : [];

    const processingPct = Number(shop.paymentProcessingPct);
    const processingFlat = Number(shop.paymentProcessingFlat);
    const minMarginPct = Number(settings.minBundleMarginPct);
    const maxCompanions = settings.maxBundleProducts - 1;

    const candidates: GeneratedBundleCandidate[] = [];

    for (const anchor of bestsellers) {
      // Select companions from dead stock products that are not the anchor
      const companions = deadStockProducts
        .filter((p) => p.id !== anchor.id)
        .slice(0, maxCompanions);

      if (companions.length === 0) {
        continue;
      }

      const allItems = [
        {
          productId: anchor.id,
          price: Number(anchor.price),
          cogs: Number(anchor.cogs!),
          shippingCost: Number(anchor.shippingCost ?? 0),
          additionalCosts: Number(anchor.additionalCosts ?? 0),
          quantity: 1,
          isAnchor: true,
          isDeadStock: anchor.isDeadStock,
          daysWithoutSale: anchor.daysWithoutSale,
          title: anchor.title,
        },
        ...companions.map((c) => ({
          productId: c.id,
          price: Number(c.price),
          cogs: Number(c.cogs!),
          shippingCost: Number(c.shippingCost ?? 0),
          additionalCosts: Number(c.additionalCosts ?? 0),
          quantity: 1,
          isAnchor: false,
          isDeadStock: c.isDeadStock,
          daysWithoutSale: c.daysWithoutSale,
          title: c.title,
        })),
      ];

      const marginInputItems = allItems.map((item) => ({
        price: item.price,
        cogs: item.cogs,
        shippingCost: item.shippingCost,
        additionalCosts: item.additionalCosts,
        quantity: item.quantity,
      }));

      const optimalDiscount = findOptimalDiscount(
        marginInputItems,
        processingPct,
        processingFlat,
        minMarginPct,
      );

      if (optimalDiscount <= 0) {
        continue;
      }

      const marginResult = calculateBundleMargin({
        items: marginInputItems,
        bundleDiscountPct: optimalDiscount,
        paymentProcessingPct: processingPct,
        paymentProcessingFlat: processingFlat,
      });

      const score = scoreBundleCandidate({
        anchorAvgDailySales: Number(anchor.avgDailySales),
        companionDaysWithoutSale: companions.map((c) => c.daysWithoutSale),
        estimatedMarginPct: marginResult.contributionMarginPct,
      });

      candidates.push({
        anchorId: anchor.id,
        companionIds: companions.map((c) => c.id),
        discountPct: optimalDiscount,
        score,
        marginResult: {
          effectivePrice: marginResult.effectivePrice,
          processingFee: marginResult.processingFee,
          contributionMargin: marginResult.contributionMargin,
          contributionMarginPct: marginResult.contributionMarginPct,
        },
        items: allItems,
      });
    }

    // Sort by score descending and take top 10
    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, 10);

    if (topCandidates.length === 0) {
      this.logger.log(
        `No viable bundle candidates found for shop ${shop.shopifyDomain}`,
      );
      return 0;
    }

    // Archive existing AUTO bundles
    await this.prisma.bundle.updateMany({
      where: {
        shopId,
        source: 'AUTO',
        status: { notIn: ['ARCHIVED'] },
      },
      data: { status: 'ARCHIVED' },
    });

    // Create new bundles
    let createdCount = 0;

    for (const candidate of topCandidates) {
      const anchorItem = candidate.items.find((item) => item.isAnchor);
      const bundleName = `${anchorItem?.title ?? 'Bundle'} + ${candidate.items.length - 1} More`;
      const slug = bundleName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const individualTotal = candidate.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const totalCogs = candidate.items.reduce(
        (sum, item) => sum + item.cogs * item.quantity,
        0,
      );
      const totalShippingCost = candidate.items.reduce(
        (sum, item) => sum + item.shippingCost * item.quantity,
        0,
      );

      await this.prisma.bundle.create({
        data: {
          shopId,
          name: bundleName,
          slug,
          type: 'DEAD_STOCK',
          status: 'DRAFT',
          source: 'AUTO',
          bundlePrice: candidate.marginResult.effectivePrice,
          individualTotal,
          discountPct: candidate.discountPct,
          discountType: 'PERCENTAGE',
          totalCogs,
          totalShippingCost,
          processingFee: candidate.marginResult.processingFee,
          contributionMargin: candidate.marginResult.contributionMargin,
          contributionMarginPct: candidate.marginResult.contributionMarginPct,
          triggerType: 'PRODUCT_PAGE',
          displayPriority: createdCount,
          items: {
            create: candidate.items.map((item, index) => ({
              productId: item.productId,
              quantity: item.quantity,
              isAnchor: item.isAnchor,
              isDeadStock: item.isDeadStock,
              sortOrder: index,
            })),
          },
          displayRules: anchorItem
            ? {
                create: {
                  targetType: 'PRODUCT' as const,
                  targetId: anchorItem.productId,
                },
              }
            : undefined,
        },
      });

      createdCount++;
    }

    this.logger.log(
      `Generated ${createdCount} bundles for shop ${shop.shopifyDomain}`,
    );

    return createdCount;
  }
}
