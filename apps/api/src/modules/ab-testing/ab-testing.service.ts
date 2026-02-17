import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listTests(shopId: string) {
    const tests = await this.prisma.aBTest.findMany({
      where: { shopId },
      include: { bundle: { select: { id: true, name: true, discountPct: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return tests.map((t) => this.toDto(t));
  }

  async getTest(shopId: string, testId: string) {
    const test = await this.prisma.aBTest.findFirst({
      where: { id: testId, shopId },
      include: { bundle: { select: { id: true, name: true, discountPct: true } } },
    });

    if (!test) throw new NotFoundException(`A/B Test ${testId} not found`);
    return this.toDto(test);
  }

  async create(shopId: string, dto: { bundleId: string; name: string; variantDiscountPct: number }) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: dto.bundleId, shopId },
    });

    if (!bundle) throw new NotFoundException(`Bundle ${dto.bundleId} not found`);

    // Check no active test for this bundle
    const existing = await this.prisma.aBTest.findFirst({
      where: { bundleId: dto.bundleId, status: 'RUNNING' },
    });
    if (existing) {
      throw new BadRequestException('Bundle already has an active A/B test');
    }

    const test = await this.prisma.aBTest.create({
      data: {
        shopId,
        bundleId: dto.bundleId,
        name: dto.name,
        controlDiscountPct: Number(bundle.discountPct),
        variantDiscountPct: dto.variantDiscountPct,
      },
      include: { bundle: { select: { id: true, name: true, discountPct: true } } },
    });

    return this.toDto(test);
  }

  async start(shopId: string, testId: string) {
    const test = await this.prisma.aBTest.findFirst({
      where: { id: testId, shopId },
    });

    if (!test) throw new NotFoundException(`A/B Test ${testId} not found`);
    if (test.status !== 'DRAFT') {
      throw new BadRequestException('Test can only be started from DRAFT status');
    }

    // Link the test to the bundle
    await this.prisma.bundle.update({
      where: { id: test.bundleId },
      data: { abTestId: test.id },
    });

    const updated = await this.prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'RUNNING' as any,
        startedAt: new Date(),
      },
      include: { bundle: { select: { id: true, name: true, discountPct: true } } },
    });

    this.logger.log(`A/B test ${testId} started for bundle ${test.bundleId}`);
    return this.toDto(updated);
  }

  async stop(shopId: string, testId: string) {
    const test = await this.prisma.aBTest.findFirst({
      where: { id: testId, shopId },
    });

    if (!test) throw new NotFoundException(`A/B Test ${testId} not found`);
    if (test.status !== 'RUNNING') {
      throw new BadRequestException('Test can only be stopped when RUNNING');
    }

    // Calculate winner using z-test for proportions
    const winner = this.calculateWinner(test);

    // Unlink test from bundle
    await this.prisma.bundle.update({
      where: { id: test.bundleId },
      data: { abTestId: null },
    });

    const updated = await this.prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED' as any,
        endedAt: new Date(),
        winnerVariant: winner.winner,
        confidenceLevel: winner.confidence,
      },
      include: { bundle: { select: { id: true, name: true, discountPct: true } } },
    });

    this.logger.log(
      `A/B test ${testId} completed. Winner: ${winner.winner || 'inconclusive'} (confidence: ${(winner.confidence * 100).toFixed(1)}%)`,
    );

    return this.toDto(updated);
  }

  /**
   * Record an impression or conversion for an A/B test variant.
   * Called from storefront service when serving bundles and tracking events.
   */
  async recordMetric(
    testId: string,
    variant: 'control' | 'variant',
    metric: 'impression' | 'conversion',
    revenue?: number,
  ): Promise<void> {
    const data: Record<string, any> = {};

    if (variant === 'control') {
      if (metric === 'impression') {
        data.controlImpressions = { increment: 1 };
      } else {
        data.controlConversions = { increment: 1 };
        if (revenue) {
          data.controlRevenue = { increment: revenue };
        }
      }
    } else {
      if (metric === 'impression') {
        data.variantImpressions = { increment: 1 };
      } else {
        data.variantConversions = { increment: 1 };
        if (revenue) {
          data.variantRevenue = { increment: revenue };
        }
      }
    }

    await this.prisma.aBTest.update({
      where: { id: testId },
      data,
    });
  }

  /**
   * Determine which variant to show for a given session.
   * Uses deterministic hash of sessionId for consistency.
   */
  assignVariant(testId: string, sessionId: string): 'control' | 'variant' {
    let hash = 0;
    const input = testId + sessionId;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 2 === 0 ? 'control' : 'variant';
  }

  private calculateWinner(test: any): { winner: string | null; confidence: number } {
    const n1 = test.controlImpressions;
    const n2 = test.variantImpressions;

    if (n1 < 30 || n2 < 30) {
      return { winner: null, confidence: 0 };
    }

    const p1 = n1 > 0 ? test.controlConversions / n1 : 0;
    const p2 = n2 > 0 ? test.variantConversions / n2 : 0;

    // Pooled proportion
    const pPool =
      (test.controlConversions + test.variantConversions) / (n1 + n2);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

    if (se === 0) {
      return { winner: null, confidence: 0 };
    }

    const zScore = (p2 - p1) / se;
    const confidence = this.zToConfidence(Math.abs(zScore));

    let winner: string | null = null;
    if (confidence >= 0.95) {
      winner = zScore > 0 ? 'variant' : 'control';
    }

    return { winner, confidence };
  }

  private zToConfidence(z: number): number {
    // Approximation of the cumulative normal distribution
    // for one-tailed test, convert to two-tailed confidence
    const t = 1 / (1 + 0.2316419 * z);
    const d = 0.3989422804014327;
    const p =
      d *
      Math.exp((-z * z) / 2) *
      (0.3193815 * t -
        0.3565638 * t * t +
        1.781478 * t * t * t -
        1.8212560 * t * t * t * t +
        1.3302744 * t * t * t * t * t);
    return 1 - 2 * p; // Two-tailed confidence
  }

  private toDto(test: any) {
    return {
      id: test.id,
      bundleId: test.bundleId,
      bundleName: test.bundle?.name,
      name: test.name,
      status: test.status,
      controlDiscountPct: Number(test.controlDiscountPct),
      variantDiscountPct: Number(test.variantDiscountPct),
      controlImpressions: test.controlImpressions,
      controlConversions: test.controlConversions,
      controlRevenue: Number(test.controlRevenue),
      controlConversionRate:
        test.controlImpressions > 0
          ? test.controlConversions / test.controlImpressions
          : 0,
      variantImpressions: test.variantImpressions,
      variantConversions: test.variantConversions,
      variantRevenue: Number(test.variantRevenue),
      variantConversionRate:
        test.variantImpressions > 0
          ? test.variantConversions / test.variantImpressions
          : 0,
      startedAt: test.startedAt?.toISOString() ?? null,
      endedAt: test.endedAt?.toISOString() ?? null,
      winnerVariant: test.winnerVariant,
      confidenceLevel: test.confidenceLevel
        ? Number(test.confidenceLevel)
        : null,
    };
  }
}
