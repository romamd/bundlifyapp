import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@bundlify/prisma-client';
import {
  findRevenueMaximizingDiscount,
  calculateBundleMargin,
} from '@bundlify/margin-engine';

@Processor('discount-optimize')
export class DiscountOptimizeProcessor extends WorkerHost {
  private readonly logger = new Logger(DiscountOptimizeProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting smart discount optimization');

    const shops = await this.prisma.shop.findMany({
      where: { uninstalledAt: null },
      include: { settings: true },
    });

    for (const shop of shops) {
      try {
        await this.optimizeShopBundles(shop);
      } catch (error) {
        this.logger.error(
          `Discount optimization failed for ${shop.shopifyDomain}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Smart discount optimization completed');
  }

  private async optimizeShopBundles(shop: any): Promise<void> {
    const bundles = await this.prisma.bundle.findMany({
      where: { shopId: shop.id, status: 'ACTIVE' },
      include: {
        items: { include: { product: true } },
      },
    });

    const minMarginPct = Number(shop.settings?.minBundleMarginPct ?? 15);

    for (const bundle of bundles) {
      // Only optimize bundles with sufficient data (>100 impressions)
      const impressionCount = await this.prisma.bundleView.count({
        where: { bundleId: bundle.id, event: 'VIEWED' },
      });

      if (impressionCount < 100) continue;

      // Gather conversion data grouped by discount level
      const history = await this.getConversionHistory(bundle.id);
      if (history.length < 3) continue;

      // Calculate total costs for margin floor
      const totalCosts = bundle.items.reduce((sum, item) => {
        return (
          sum +
          Number(item.product.cogs ?? 0) * item.quantity +
          Number(item.product.shippingCost ?? 0) * item.quantity +
          Number(item.product.additionalCosts ?? 0) * item.quantity
        );
      }, 0);

      const basePrice = Number(bundle.individualTotal);
      const processingFee =
        basePrice * (Number(shop.paymentProcessingPct) / 100) +
        Number(shop.paymentProcessingFlat);
      const allCosts = totalCosts + processingFee;

      const result = findRevenueMaximizingDiscount(
        history,
        basePrice,
        allCosts,
        minMarginPct,
      );

      if (!result) continue;

      const currentDiscount = Number(bundle.discountPct);
      const diff = Math.abs(result.discountPct - currentDiscount);

      // Only adjust if difference is > 2%
      if (diff <= 2) continue;

      // Recalculate margin with new discount
      const marginResult = calculateBundleMargin({
        items: bundle.items.map((item) => ({
          price: Number(item.product.price),
          cogs: Number(item.product.cogs ?? 0),
          shippingCost: Number(item.product.shippingCost ?? 0),
          additionalCosts: Number(item.product.additionalCosts ?? 0),
          quantity: item.quantity,
        })),
        bundleDiscountPct: result.discountPct,
        paymentProcessingPct: Number(shop.paymentProcessingPct),
        paymentProcessingFlat: Number(shop.paymentProcessingFlat),
      });

      // Update bundle
      await this.prisma.bundle.update({
        where: { id: bundle.id },
        data: {
          discountPct: result.discountPct,
          bundlePrice: marginResult.effectivePrice,
          processingFee: marginResult.processingFee,
          contributionMargin: marginResult.contributionMargin,
          contributionMarginPct: marginResult.contributionMarginPct,
        },
      });

      // Record in discount history
      await this.prisma.discountHistory.create({
        data: {
          bundleId: bundle.id,
          shopId: shop.id,
          previousDiscountPct: currentDiscount,
          newDiscountPct: result.discountPct,
          reason: 'elasticity_optimization',
        },
      });

      this.logger.log(
        `Optimized bundle ${bundle.id} (${bundle.name}): ${currentDiscount}% -> ${result.discountPct}% (expected margin: ${result.expectedMarginPct.toFixed(1)}%)`,
      );
    }
  }

  private async getConversionHistory(
    bundleId: string,
  ): Promise<{ discountPct: number; conversionRate: number }[]> {
    // Get discount history + current discount
    const discountRecords = await this.prisma.discountHistory.findMany({
      where: { bundleId },
      orderBy: { appliedAt: 'asc' },
    });

    const bundle = await this.prisma.bundle.findUnique({
      where: { id: bundleId },
    });
    if (!bundle) return [];

    // Build time ranges for each discount level
    const ranges: { discountPct: number; from: Date; to: Date }[] = [];

    for (let i = 0; i < discountRecords.length; i++) {
      const record = discountRecords[i];
      const nextRecord = discountRecords[i + 1];
      ranges.push({
        discountPct: Number(record.previousDiscountPct),
        from: i === 0 ? bundle.createdAt : discountRecords[i - 1].appliedAt,
        to: record.appliedAt,
      });
    }

    // Add current discount range
    ranges.push({
      discountPct: Number(bundle.discountPct),
      from:
        discountRecords.length > 0
          ? discountRecords[discountRecords.length - 1].appliedAt
          : bundle.createdAt,
      to: new Date(),
    });

    // Calculate conversion rate for each range
    const history: { discountPct: number; conversionRate: number }[] = [];

    for (const range of ranges) {
      const views = await this.prisma.bundleView.count({
        where: {
          bundleId,
          event: 'VIEWED',
          createdAt: { gte: range.from, lt: range.to },
        },
      });

      const purchases = await this.prisma.bundleView.count({
        where: {
          bundleId,
          event: 'PURCHASED',
          createdAt: { gte: range.from, lt: range.to },
        },
      });

      if (views > 10) {
        history.push({
          discountPct: range.discountPct,
          conversionRate: purchases / views,
        });
      }
    }

    return history;
  }
}
