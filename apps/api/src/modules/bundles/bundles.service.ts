import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import { calculateBundleMargin } from '@bundlify/margin-engine';
import type { BundleDto } from '@bundlify/shared-types';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

@Injectable()
export class BundlesService {
  constructor(private readonly prisma: PrismaService) {}

  async listBundles(shopId: string): Promise<BundleDto[]> {
    const bundles = await this.prisma.bundle.findMany({
      where: { shopId },
      include: {
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        displayRules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bundles.map((bundle) => this.toDto(bundle));
  }

  async getBundle(shopId: string, bundleId: string): Promise<BundleDto> {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, shopId },
      include: {
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        displayRules: true,
      },
    });

    if (!bundle) {
      throw new NotFoundException(`Bundle ${bundleId} not found`);
    }

    return this.toDto(bundle);
  }

  async createBundle(
    shopId: string,
    dto: CreateBundleDto,
  ): Promise<BundleDto> {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const marginItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        price: Number(product.price),
        cogs: Number(product.cogs ?? 0),
        shippingCost: Number(product.shippingCost ?? 0),
        additionalCosts: Number(product.additionalCosts ?? 0),
        quantity: item.quantity,
      };
    });

    const marginResult = calculateBundleMargin({
      items: marginItems,
      bundleDiscountPct: dto.discountPct,
      paymentProcessingPct: Number(shop.paymentProcessingPct),
      paymentProcessingFlat: Number(shop.paymentProcessingFlat),
    });

    const individualTotal = marginItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const totalCogs = marginItems.reduce(
      (sum, item) => sum + item.cogs * item.quantity,
      0,
    );
    const totalShippingCost = marginItems.reduce(
      (sum, item) => sum + item.shippingCost * item.quantity,
      0,
    );

    const slug = this.generateSlug(dto.name);

    const bundle = await this.prisma.bundle.create({
      data: {
        shopId,
        name: dto.name,
        slug,
        type: dto.type as any,
        status: 'DRAFT',
        source: 'MANUAL',
        bundlePrice: marginResult.effectivePrice,
        individualTotal,
        discountPct: dto.discountPct,
        discountType: dto.discountType as any,
        totalCogs,
        totalShippingCost,
        processingFee: marginResult.processingFee,
        contributionMargin: marginResult.contributionMargin,
        contributionMarginPct: marginResult.contributionMarginPct,
        triggerType: dto.triggerType as any,
        minCartValue: dto.minCartValue ?? null,
        maxCartValue: dto.maxCartValue ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        items: {
          create: dto.items.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            isAnchor: item.isAnchor,
            isDeadStock: productMap.get(item.productId)?.isDeadStock ?? false,
            sortOrder: index,
          })),
        },
        displayRules: dto.displayRules
          ? {
              create: dto.displayRules.map((rule) => ({
                targetType: rule.targetType as any,
                targetId: rule.targetId,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        displayRules: true,
      },
    });

    return this.toDto(bundle);
  }

  async updateBundle(
    shopId: string,
    bundleId: string,
    dto: UpdateBundleDto,
  ): Promise<BundleDto> {
    const existing = await this.prisma.bundle.findFirst({
      where: { id: bundleId, shopId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Bundle ${bundleId} not found`);
    }

    const needsMarginRecalc =
      dto.items !== undefined || dto.discountPct !== undefined;

    let marginData: Record<string, any> = {};

    if (needsMarginRecalc) {
      const shop = await this.prisma.shop.findUniqueOrThrow({
        where: { id: shopId },
      });

      let products: any[];
      let itemsForCalc: { productId: string; quantity: number; isAnchor: boolean }[];

      if (dto.items) {
        const productIds = dto.items.map((item) => item.productId);
        products = await this.prisma.product.findMany({
          where: { id: { in: productIds }, shopId },
        });
        if (products.length !== productIds.length) {
          throw new NotFoundException('One or more products not found');
        }
        itemsForCalc = dto.items;
      } else {
        products = existing.items.map((item) => item.product);
        itemsForCalc = existing.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          isAnchor: item.isAnchor,
        }));
      }

      const productMap = new Map(products.map((p: any) => [p.id, p]));
      const discountPct = dto.discountPct ?? Number(existing.discountPct);

      const marginItems = itemsForCalc.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          price: Number(product.price),
          cogs: Number(product.cogs ?? 0),
          shippingCost: Number(product.shippingCost ?? 0),
          additionalCosts: Number(product.additionalCosts ?? 0),
          quantity: item.quantity,
        };
      });

      const marginResult = calculateBundleMargin({
        items: marginItems,
        bundleDiscountPct: discountPct,
        paymentProcessingPct: Number(shop.paymentProcessingPct),
        paymentProcessingFlat: Number(shop.paymentProcessingFlat),
      });

      const individualTotal = marginItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const totalCogs = marginItems.reduce(
        (sum, item) => sum + item.cogs * item.quantity,
        0,
      );
      const totalShippingCost = marginItems.reduce(
        (sum, item) => sum + item.shippingCost * item.quantity,
        0,
      );

      marginData = {
        bundlePrice: marginResult.effectivePrice,
        individualTotal,
        totalCogs,
        totalShippingCost,
        processingFee: marginResult.processingFee,
        contributionMargin: marginResult.contributionMargin,
        contributionMarginPct: marginResult.contributionMarginPct,
      };
    }

    // If items are changing, delete old items and create new ones
    if (dto.items) {
      await this.prisma.bundleItem.deleteMany({
        where: { bundleId },
      });
    }

    // If display rules are changing, delete old rules and create new ones
    if (dto.displayRules) {
      await this.prisma.bundleDisplayRule.deleteMany({
        where: { bundleId },
      });
    }

    const bundle = await this.prisma.bundle.update({
      where: { id: bundleId },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: this.generateSlug(dto.name) }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.discountPct !== undefined && { discountPct: dto.discountPct }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType as any }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType as any }),
        ...(dto.minCartValue !== undefined && { minCartValue: dto.minCartValue }),
        ...(dto.maxCartValue !== undefined && { maxCartValue: dto.maxCartValue }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.endsAt !== undefined && { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }),
        ...marginData,
        ...(dto.items && {
          items: {
            create: dto.items.map((item, index) => ({
              productId: item.productId,
              quantity: item.quantity,
              isAnchor: item.isAnchor,
              isDeadStock: false,
              sortOrder: index,
            })),
          },
        }),
        ...(dto.displayRules && {
          displayRules: {
            create: dto.displayRules.map((rule) => ({
              targetType: rule.targetType as any,
              targetId: rule.targetId,
            })),
          },
        }),
      },
      include: {
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        displayRules: true,
      },
    });

    return this.toDto(bundle);
  }

  async deleteBundle(shopId: string, bundleId: string): Promise<void> {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, shopId },
    });

    if (!bundle) {
      throw new NotFoundException(`Bundle ${bundleId} not found`);
    }

    await this.prisma.bundle.delete({
      where: { id: bundleId },
    });
  }

  async setStatus(
    shopId: string,
    bundleId: string,
    status: string,
  ): Promise<BundleDto> {
    const existing = await this.prisma.bundle.findFirst({
      where: { id: bundleId, shopId },
    });

    if (!existing) {
      throw new NotFoundException(`Bundle ${bundleId} not found`);
    }

    const bundle = await this.prisma.bundle.update({
      where: { id: bundleId },
      data: { status: status as any },
      include: {
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        displayRules: true,
      },
    });

    return this.toDto(bundle);
  }

  private toDto(bundle: any): BundleDto {
    return {
      id: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      type: bundle.type,
      status: bundle.status,
      source: bundle.source,
      bundlePrice: Number(bundle.bundlePrice),
      individualTotal: Number(bundle.individualTotal),
      discountPct: Number(bundle.discountPct),
      contributionMargin: bundle.contributionMargin
        ? Number(bundle.contributionMargin)
        : null,
      contributionMarginPct: bundle.contributionMarginPct
        ? Number(bundle.contributionMarginPct)
        : null,
      triggerType: bundle.triggerType,
      items: (bundle.items ?? []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product.id,
          shopifyProductId: item.product.shopifyProductId,
          shopifyVariantId: item.product.shopifyVariantId,
          title: item.product.title,
          variantTitle: item.product.variantTitle,
          sku: item.product.sku,
          price: Number(item.product.price),
          compareAtPrice: item.product.compareAtPrice
            ? Number(item.product.compareAtPrice)
            : null,
          cogs: item.product.cogs ? Number(item.product.cogs) : null,
          shippingCost: item.product.shippingCost
            ? Number(item.product.shippingCost)
            : null,
          additionalCosts: item.product.additionalCosts
            ? Number(item.product.additionalCosts)
            : null,
          contributionMargin: item.product.contributionMargin
            ? Number(item.product.contributionMargin)
            : null,
          contributionMarginPct: item.product.contributionMarginPct
            ? Number(item.product.contributionMarginPct)
            : null,
          inventoryQuantity: item.product.inventoryQuantity,
          avgDailySales: Number(item.product.avgDailySales),
          daysWithoutSale: item.product.daysWithoutSale,
          isDeadStock: item.product.isDeadStock,
          imageUrl: item.product.imageUrl,
          status: item.product.status,
        },
        quantity: item.quantity,
        isAnchor: item.isAnchor,
        isDeadStock: item.isDeadStock,
        sortOrder: item.sortOrder,
      })),
      displayRules: (bundle.displayRules ?? []).map((rule: any) => ({
        targetType: rule.targetType,
        targetId: rule.targetId,
      })),
      currentRedemptions: bundle.currentRedemptions,
      startsAt: bundle.startsAt ? bundle.startsAt.toISOString() : null,
      endsAt: bundle.endsAt ? bundle.endsAt.toISOString() : null,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
