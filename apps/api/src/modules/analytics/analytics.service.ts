import { Injectable } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import type { DashboardDto } from '@bundlify/shared-types';

type DateRange = '7d' | '30d' | '90d';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(shopId: string, range: DateRange): Promise<DashboardDto> {
    const rangeStart = this.getRangeStart(range);

    const baseWhere = {
      shopId,
      createdAt: { gte: rangeStart },
    };

    const [
      totalViews,
      totalClicks,
      totalAddToCarts,
      purchaseAgg,
      topBundlesRaw,
      deadStockAgg,
      deadStockCount,
    ] = await Promise.all([
      this.prisma.bundleView.count({
        where: { ...baseWhere, event: 'VIEWED' },
      }),
      this.prisma.bundleView.count({
        where: { ...baseWhere, event: 'CLICKED' },
      }),
      this.prisma.bundleView.count({
        where: { ...baseWhere, event: 'ADDED_TO_CART' },
      }),
      this.prisma.bundleView.aggregate({
        where: { ...baseWhere, event: 'PURCHASED' },
        _count: true,
        _sum: { revenue: true, margin: true },
      }),
      this.prisma.bundleView.groupBy({
        by: ['bundleId'],
        where: { ...baseWhere, event: 'PURCHASED' },
        _sum: { revenue: true, margin: true },
        _count: true,
        orderBy: { _sum: { revenue: 'desc' } },
        take: 5,
      }),
      this.prisma.product.aggregate({
        where: { shopId, isDeadStock: true },
        _sum: { price: true },
        _count: true,
      }),
      this.prisma.product.count({
        where: { shopId, isDeadStock: true },
      }),
    ]);

    const totalPurchases = purchaseAgg._count;
    const totalBundleRevenue = Number(purchaseAgg._sum.revenue ?? 0);
    const totalBundleMargin = Number(purchaseAgg._sum.margin ?? 0);
    const bundleConversionRate =
      totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    // Fetch bundle names for top bundles
    const bundleIds = topBundlesRaw.map((b) => b.bundleId);
    const bundles =
      bundleIds.length > 0
        ? await this.prisma.bundle.findMany({
            where: { id: { in: bundleIds } },
            select: { id: true, name: true },
          })
        : [];

    const bundleNameMap = new Map(bundles.map((b) => [b.id, b.name]));

    const topBundles = topBundlesRaw.map((b) => ({
      bundleId: b.bundleId,
      name: bundleNameMap.get(b.bundleId) || 'Unknown Bundle',
      revenue: Number(b._sum.revenue ?? 0),
      margin: Number(b._sum.margin ?? 0),
      conversions: b._count,
    }));

    // Dead stock value: sum of (price * inventoryQuantity) for dead stock products
    // Since Prisma doesn't support computed aggregate, we fetch and calculate
    const deadStockProducts = await this.prisma.product.findMany({
      where: { shopId, isDeadStock: true },
      select: { price: true, inventoryQuantity: true },
    });

    const deadStockValue = deadStockProducts.reduce(
      (sum, p) => sum + Number(p.price) * p.inventoryQuantity,
      0,
    );

    return {
      totalBundleRevenue,
      totalBundleMargin,
      bundleConversionRate: Math.round(bundleConversionRate * 100) / 100,
      totalViews,
      totalClicks,
      totalAddToCarts,
      totalPurchases,
      topBundles,
      deadStockValue,
      deadStockCount,
    };
  }

  async getBundleAnalytics(shopId: string, range: DateRange) {
    const rangeStart = this.getRangeStart(range);

    const bundles = await this.prisma.bundle.findMany({
      where: { shopId },
      select: { id: true, name: true, status: true, type: true },
      orderBy: { createdAt: 'desc' },
    });

    const bundleIds = bundles.map((b) => b.id);

    if (bundleIds.length === 0) {
      return [];
    }

    const eventCounts = await this.prisma.bundleView.groupBy({
      by: ['bundleId', 'event'],
      where: {
        shopId,
        bundleId: { in: bundleIds },
        createdAt: { gte: rangeStart },
      },
      _count: true,
      _sum: { revenue: true },
    });

    const bundleStatsMap = new Map<
      string,
      {
        views: number;
        clicks: number;
        addToCarts: number;
        purchases: number;
        revenue: number;
      }
    >();

    for (const row of eventCounts) {
      if (!bundleStatsMap.has(row.bundleId)) {
        bundleStatsMap.set(row.bundleId, {
          views: 0,
          clicks: 0,
          addToCarts: 0,
          purchases: 0,
          revenue: 0,
        });
      }

      const stats = bundleStatsMap.get(row.bundleId)!;
      switch (row.event) {
        case 'VIEWED':
          stats.views = row._count;
          break;
        case 'CLICKED':
          stats.clicks = row._count;
          break;
        case 'ADDED_TO_CART':
          stats.addToCarts = row._count;
          break;
        case 'PURCHASED':
          stats.purchases = row._count;
          stats.revenue = Number(row._sum.revenue ?? 0);
          break;
      }
    }

    return bundles.map((bundle) => {
      const stats = bundleStatsMap.get(bundle.id) || {
        views: 0,
        clicks: 0,
        addToCarts: 0,
        purchases: 0,
        revenue: 0,
      };

      return {
        bundleId: bundle.id,
        name: bundle.name,
        status: bundle.status,
        type: bundle.type,
        views: stats.views,
        clicks: stats.clicks,
        addToCarts: stats.addToCarts,
        purchases: stats.purchases,
        revenue: stats.revenue,
        conversionRate:
          stats.views > 0
            ? Math.round((stats.purchases / stats.views) * 10000) / 100
            : 0,
      };
    });
  }

  async getProductAnalytics(shopId: string) {
    const products = await this.prisma.product.findMany({
      where: { shopId },
      select: {
        id: true,
        shopifyProductId: true,
        title: true,
        variantTitle: true,
        sku: true,
        price: true,
        cogs: true,
        shippingCost: true,
        additionalCosts: true,
        contributionMargin: true,
        contributionMarginPct: true,
        inventoryQuantity: true,
        avgDailySales: true,
        daysWithoutSale: true,
        isDeadStock: true,
        imageUrl: true,
      },
      orderBy: { contributionMarginPct: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      shopifyProductId: p.shopifyProductId,
      title: p.title,
      variantTitle: p.variantTitle,
      sku: p.sku,
      price: Number(p.price),
      cogs: p.cogs ? Number(p.cogs) : null,
      shippingCost: p.shippingCost ? Number(p.shippingCost) : null,
      additionalCosts: p.additionalCosts ? Number(p.additionalCosts) : null,
      contributionMargin: p.contributionMargin
        ? Number(p.contributionMargin)
        : null,
      contributionMarginPct: p.contributionMarginPct
        ? Number(p.contributionMarginPct)
        : null,
      inventoryQuantity: p.inventoryQuantity,
      avgDailySales: Number(p.avgDailySales),
      daysWithoutSale: p.daysWithoutSale,
      isDeadStock: p.isDeadStock,
      imageUrl: p.imageUrl,
    }));
  }

  async getProductPairs(shopId: string) {
    const pairs = await this.prisma.productAffinity.findMany({
      where: { shopId },
      orderBy: { affinityScore: 'desc' },
      take: 10,
      include: {
        productA: { select: { id: true, title: true, imageUrl: true, price: true } },
        productB: { select: { id: true, title: true, imageUrl: true, price: true } },
      },
    });

    return pairs.map((p) => ({
      id: p.id,
      productA: {
        id: p.productA.id,
        title: p.productA.title,
        imageUrl: p.productA.imageUrl,
        price: Number(p.productA.price),
      },
      productB: {
        id: p.productB.id,
        title: p.productB.title,
        imageUrl: p.productB.imageUrl,
        price: Number(p.productB.price),
      },
      coOccurrences: p.coOccurrences,
      affinityScore: Number(p.affinityScore),
    }));
  }

  private getRangeStart(range: DateRange): Date {
    const now = new Date();
    const daysMap: Record<DateRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = daysMap[range] || 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
}
