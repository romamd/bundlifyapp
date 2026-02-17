import { Injectable } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import type { ShopSettingsDto } from '@bundlify/shared-types';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(shopId: string): Promise<ShopSettingsDto> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });

    let settings = await this.prisma.shopSettings.findUnique({
      where: { shopId },
    });

    if (!settings) {
      settings = await this.prisma.shopSettings.create({
        data: { shopId },
      });
    }

    return this.toDto(settings, shop);
  }

  async updateSettings(
    shopId: string,
    dto: UpdateSettingsDto,
  ): Promise<ShopSettingsDto> {
    // Update ShopSettings fields
    const settingsData: Record<string, any> = {};

    if (dto.bundleWidgetEnabled !== undefined)
      settingsData.bundleWidgetEnabled = dto.bundleWidgetEnabled;
    if (dto.checkoutUpsellEnabled !== undefined)
      settingsData.checkoutUpsellEnabled = dto.checkoutUpsellEnabled;
    if (dto.exitIntentEnabled !== undefined)
      settingsData.exitIntentEnabled = dto.exitIntentEnabled;
    if (dto.autoGenerateBundles !== undefined)
      settingsData.autoGenerateBundles = dto.autoGenerateBundles;
    if (dto.minBundleMarginPct !== undefined)
      settingsData.minBundleMarginPct = dto.minBundleMarginPct;
    if (dto.maxBundleProducts !== undefined)
      settingsData.maxBundleProducts = dto.maxBundleProducts;
    if (dto.includeDeadStock !== undefined)
      settingsData.includeDeadStock = dto.includeDeadStock;
    if (dto.deadStockDaysThreshold !== undefined)
      settingsData.deadStockDaysThreshold = dto.deadStockDaysThreshold;
    if (dto.showOnProductPage !== undefined)
      settingsData.showOnProductPage = dto.showOnProductPage;
    if (dto.showOnCartPage !== undefined)
      settingsData.showOnCartPage = dto.showOnCartPage;
    if (dto.showAtCheckout !== undefined)
      settingsData.showAtCheckout = dto.showAtCheckout;
    if (dto.showOnExitIntent !== undefined)
      settingsData.showOnExitIntent = dto.showOnExitIntent;
    if (dto.multiCurrencyEnabled !== undefined)
      settingsData.multiCurrencyEnabled = dto.multiCurrencyEnabled;
    if (dto.displayCurrency !== undefined)
      settingsData.displayCurrency = dto.displayCurrency;

    // Ensure settings row exists before updating
    await this.prisma.shopSettings.upsert({
      where: { shopId },
      update: settingsData,
      create: { shopId, ...settingsData },
    });

    // Update Shop cost-related fields if provided
    const shopData: Record<string, any> = {};
    if (dto.defaultShippingCost !== undefined)
      shopData.defaultShippingCost = dto.defaultShippingCost;
    if (dto.paymentProcessingPct !== undefined)
      shopData.paymentProcessingPct = dto.paymentProcessingPct;
    if (dto.paymentProcessingFlat !== undefined)
      shopData.paymentProcessingFlat = dto.paymentProcessingFlat;

    if (Object.keys(shopData).length > 0) {
      await this.prisma.shop.update({
        where: { id: shopId },
        data: shopData,
      });
    }

    return this.getSettings(shopId);
  }

  private toDto(settings: any, shop: any): ShopSettingsDto {
    return {
      bundleWidgetEnabled: settings.bundleWidgetEnabled,
      checkoutUpsellEnabled: settings.checkoutUpsellEnabled,
      exitIntentEnabled: settings.exitIntentEnabled,
      autoGenerateBundles: settings.autoGenerateBundles,
      minBundleMarginPct: Number(settings.minBundleMarginPct),
      maxBundleProducts: settings.maxBundleProducts,
      includeDeadStock: settings.includeDeadStock,
      deadStockDaysThreshold: settings.deadStockDaysThreshold,
      showOnProductPage: settings.showOnProductPage,
      showOnCartPage: settings.showOnCartPage,
      showAtCheckout: settings.showAtCheckout,
      showOnExitIntent: settings.showOnExitIntent,
      multiCurrencyEnabled: settings.multiCurrencyEnabled,
      displayCurrency: settings.displayCurrency ?? '',
      defaultShippingCost: Number(shop.defaultShippingCost),
      paymentProcessingPct: Number(shop.paymentProcessingPct),
      paymentProcessingFlat: Number(shop.paymentProcessingFlat),
    };
  }
}
