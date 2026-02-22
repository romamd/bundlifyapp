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
        upsells: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        volumeTiers: {
          orderBy: { minQuantity: 'asc' },
        },
        giftTiers: {
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
        upsells: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        volumeTiers: {
          orderBy: { minQuantity: 'asc' },
        },
        giftTiers: {
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
        bogoGetQuantity: dto.bogoGetQuantity ?? null,
        bogoGetDiscountPct: dto.bogoGetDiscountPct ?? null,
        giftsEnabled: dto.giftsEnabled ?? false,
        giftsTitle: dto.giftsTitle ?? 'Free gifts with your order',
        giftsSubtitle: dto.giftsSubtitle ?? null,
        countdownEnabled: dto.countdownEnabled ?? false,
        countdownType: dto.countdownType ?? 'fixed',
        countdownDuration: dto.countdownDuration ?? null,
        countdownEndDate: dto.countdownEndDate ? new Date(dto.countdownEndDate) : null,
        countdownTitle: dto.countdownTitle ?? null,
        countdownBgColor: dto.countdownBgColor ?? '#111827',
        countdownTextColor: dto.countdownTextColor ?? '#ffffff',
        countdownTitleFontSize: dto.countdownTitleFontSize ?? null,
        countdownTitleFontWeight: dto.countdownTitleFontWeight ?? null,
        countdownTitleAlignment: dto.countdownTitleAlignment ?? 'center',
        giftsLayout: dto.giftsLayout ?? 'vertical',
        giftsHideUntilUnlocked: dto.giftsHideUntilUnlocked ?? false,
        giftsShowLockedLabels: dto.giftsShowLockedLabels ?? true,
        lowStockAlertEnabled: dto.lowStockAlertEnabled ?? false,
        skipToCheckout: dto.skipToCheckout ?? false,
        customCss: dto.customCss ?? null,
        translations: dto.translations ?? null,
        themeOverrides: dto.themeOverrides ? JSON.stringify(dto.themeOverrides) : null,
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
        volumeTiers: dto.volumeTiers
          ? {
              create: dto.volumeTiers.map((tier) => ({
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity ?? null,
                discountPct: tier.discountPct,
                label: tier.label ?? null,
              })),
            }
          : undefined,
        giftTiers: dto.giftTiers
          ? {
              create: dto.giftTiers.map((g, idx) => ({
                productId: g.productId ?? null,
                giftType: g.giftType,
                unlockQuantity: g.unlockQuantity,
                label: g.label ?? null,
                lockedTitle: g.lockedTitle ?? 'Locked',
                imageUrl: g.imageUrl ?? null,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        upsells: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        volumeTiers: {
          orderBy: { minQuantity: 'asc' },
        },
        giftTiers: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        displayRules: true,
      },
    });

    if (dto.upsells?.length) {
      await this.prisma.bundleUpsell.createMany({
        data: dto.upsells.map((u, idx) => ({
          bundleId: bundle.id,
          productId: u.productId,
          discountType: u.discountType,
          discountValue: u.discountValue,
          title: u.title,
          subtitle: u.subtitle ?? null,
          selectedByDefault: u.selectedByDefault,
          matchQuantity: u.matchQuantity,
          sortOrder: idx,
        })),
      });

      // Re-fetch to include newly created upsells with product relation
      const refreshed = await this.prisma.bundle.findUniqueOrThrow({
        where: { id: bundle.id },
        include: {
          items: {
            include: { product: true },
            orderBy: { sortOrder: 'asc' },
          },
          upsells: {
            include: { product: true },
            orderBy: { sortOrder: 'asc' },
          },
          volumeTiers: {
            orderBy: { minQuantity: 'asc' },
          },
          giftTiers: {
            include: { product: true },
            orderBy: { sortOrder: 'asc' },
          },
          displayRules: true,
        },
      });

      return this.toDto(refreshed);
    }

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

    // If volume tiers are changing, delete old tiers and create new ones
    if (dto.volumeTiers) {
      await this.prisma.volumeTier.deleteMany({
        where: { bundleId },
      });
    }

    // If upsells are changing, delete old upsells and recreate
    if (dto.upsells) {
      await this.prisma.bundleUpsell.deleteMany({
        where: { bundleId },
      });
    }

    // If gift tiers are changing, delete old gift tiers and create new ones
    if (dto.giftTiers) {
      await this.prisma.giftTier.deleteMany({
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
        ...(dto.bogoGetQuantity !== undefined && { bogoGetQuantity: dto.bogoGetQuantity }),
        ...(dto.bogoGetDiscountPct !== undefined && { bogoGetDiscountPct: dto.bogoGetDiscountPct }),
        ...(dto.giftsEnabled !== undefined && { giftsEnabled: dto.giftsEnabled }),
        ...(dto.giftsTitle !== undefined && { giftsTitle: dto.giftsTitle }),
        ...(dto.giftsSubtitle !== undefined && { giftsSubtitle: dto.giftsSubtitle }),
        ...(dto.countdownEnabled !== undefined && { countdownEnabled: dto.countdownEnabled }),
        ...(dto.countdownType !== undefined && { countdownType: dto.countdownType }),
        ...(dto.countdownDuration !== undefined && { countdownDuration: dto.countdownDuration }),
        ...(dto.countdownEndDate !== undefined && { countdownEndDate: dto.countdownEndDate ? new Date(dto.countdownEndDate) : null }),
        ...(dto.countdownTitle !== undefined && { countdownTitle: dto.countdownTitle }),
        ...(dto.countdownBgColor !== undefined && { countdownBgColor: dto.countdownBgColor }),
        ...(dto.countdownTextColor !== undefined && { countdownTextColor: dto.countdownTextColor }),
        ...(dto.countdownTitleFontSize !== undefined && { countdownTitleFontSize: dto.countdownTitleFontSize }),
        ...(dto.countdownTitleFontWeight !== undefined && { countdownTitleFontWeight: dto.countdownTitleFontWeight }),
        ...(dto.countdownTitleAlignment !== undefined && { countdownTitleAlignment: dto.countdownTitleAlignment }),
        ...(dto.giftsLayout !== undefined && { giftsLayout: dto.giftsLayout }),
        ...(dto.giftsHideUntilUnlocked !== undefined && { giftsHideUntilUnlocked: dto.giftsHideUntilUnlocked }),
        ...(dto.giftsShowLockedLabels !== undefined && { giftsShowLockedLabels: dto.giftsShowLockedLabels }),
        ...(dto.lowStockAlertEnabled !== undefined && { lowStockAlertEnabled: dto.lowStockAlertEnabled }),
        ...(dto.skipToCheckout !== undefined && { skipToCheckout: dto.skipToCheckout }),
        ...(dto.customCss !== undefined && { customCss: dto.customCss }),
        ...(dto.translations !== undefined && { translations: dto.translations }),
        ...(dto.themeOverrides !== undefined && {
          themeOverrides: dto.themeOverrides && Object.keys(dto.themeOverrides).length > 0
            ? JSON.stringify(dto.themeOverrides)
            : null,
        }),
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
        ...(dto.volumeTiers && {
          volumeTiers: {
            create: dto.volumeTiers.map((tier) => ({
              minQuantity: tier.minQuantity,
              maxQuantity: tier.maxQuantity ?? null,
              discountPct: tier.discountPct,
              label: tier.label ?? null,
            })),
          },
        }),
        ...(dto.upsells && {
          upsells: {
            create: dto.upsells.map((u, idx) => ({
              productId: u.productId,
              discountType: u.discountType,
              discountValue: u.discountValue,
              title: u.title,
              subtitle: u.subtitle ?? null,
              selectedByDefault: u.selectedByDefault,
              matchQuantity: u.matchQuantity,
              sortOrder: idx,
            })),
          },
        }),
        ...(dto.giftTiers && {
          giftTiers: {
            create: dto.giftTiers.map((g, idx) => ({
              productId: g.productId ?? null,
              giftType: g.giftType,
              unlockQuantity: g.unlockQuantity,
              label: g.label ?? null,
              lockedTitle: g.lockedTitle ?? 'Locked',
              imageUrl: g.imageUrl ?? null,
              sortOrder: idx,
            })),
          },
        }),
      },
      include: {
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        upsells: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        volumeTiers: {
          orderBy: { minQuantity: 'asc' },
        },
        giftTiers: {
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
        upsells: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        volumeTiers: {
          orderBy: { minQuantity: 'asc' },
        },
        giftTiers: {
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
      upsells: (bundle.upsells ?? []).map((u: any) => ({
        id: u.id,
        productId: u.productId,
        product: {
          id: u.product.id,
          shopifyProductId: u.product.shopifyProductId,
          shopifyVariantId: u.product.shopifyVariantId,
          title: u.product.title,
          variantTitle: u.product.variantTitle,
          sku: u.product.sku,
          price: Number(u.product.price),
          compareAtPrice: u.product.compareAtPrice
            ? Number(u.product.compareAtPrice)
            : null,
          cogs: u.product.cogs ? Number(u.product.cogs) : null,
          shippingCost: u.product.shippingCost
            ? Number(u.product.shippingCost)
            : null,
          additionalCosts: u.product.additionalCosts
            ? Number(u.product.additionalCosts)
            : null,
          contributionMargin: u.product.contributionMargin
            ? Number(u.product.contributionMargin)
            : null,
          contributionMarginPct: u.product.contributionMarginPct
            ? Number(u.product.contributionMarginPct)
            : null,
          inventoryQuantity: u.product.inventoryQuantity,
          avgDailySales: Number(u.product.avgDailySales),
          daysWithoutSale: u.product.daysWithoutSale,
          isDeadStock: u.product.isDeadStock,
          imageUrl: u.product.imageUrl,
          status: u.product.status,
        },
        discountType: u.discountType,
        discountValue: Number(u.discountValue),
        title: u.title,
        subtitle: u.subtitle,
        selectedByDefault: u.selectedByDefault,
        matchQuantity: u.matchQuantity,
        sortOrder: u.sortOrder,
      })),
      volumeTiers: (bundle.volumeTiers ?? []).map((tier: any) => ({
        id: tier.id,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        discountPct: Number(tier.discountPct),
        discountType: tier.discountType,
        pricePerUnit: tier.pricePerUnit != null ? Number(tier.pricePerUnit) : null,
        label: tier.label,
      })),
      displayRules: (bundle.displayRules ?? []).map((rule: any) => ({
        targetType: rule.targetType,
        targetId: rule.targetId,
      })),
      giftsEnabled: bundle.giftsEnabled ?? false,
      giftsTitle: bundle.giftsTitle ?? 'Free gifts with your order',
      giftsSubtitle: bundle.giftsSubtitle ?? null,
      giftTiers: (bundle.giftTiers ?? []).map((g: any) => ({
        id: g.id,
        productId: g.productId,
        giftType: g.giftType,
        unlockQuantity: g.unlockQuantity,
        label: g.label,
        lockedTitle: g.lockedTitle,
        imageUrl: g.imageUrl,
        sortOrder: g.sortOrder,
      })),
      bogoGetQuantity: bundle.bogoGetQuantity ?? null,
      bogoGetDiscountPct: bundle.bogoGetDiscountPct
        ? Number(bundle.bogoGetDiscountPct)
        : null,
      countdownEnabled: bundle.countdownEnabled,
      countdownType: bundle.countdownType,
      countdownDuration: bundle.countdownDuration,
      countdownEndDate: bundle.countdownEndDate?.toISOString() ?? null,
      countdownTitle: bundle.countdownTitle,
      countdownBgColor: bundle.countdownBgColor,
      countdownTextColor: bundle.countdownTextColor,
      countdownTitleFontSize: bundle.countdownTitleFontSize ?? null,
      countdownTitleFontWeight: bundle.countdownTitleFontWeight ?? null,
      countdownTitleAlignment: bundle.countdownTitleAlignment ?? 'center',
      giftsLayout: bundle.giftsLayout ?? 'vertical',
      giftsHideUntilUnlocked: bundle.giftsHideUntilUnlocked ?? false,
      giftsShowLockedLabels: bundle.giftsShowLockedLabels ?? true,
      lowStockAlertEnabled: bundle.lowStockAlertEnabled ?? false,
      skipToCheckout: bundle.skipToCheckout ?? false,
      customCss: bundle.customCss ?? null,
      translations: bundle.translations ? JSON.parse(bundle.translations) : null,
      themeOverrides: bundle.themeOverrides ? JSON.parse(bundle.themeOverrides) : null,
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
