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
    if (dto.cartDrawerEnabled !== undefined)
      settingsData.cartDrawerEnabled = dto.cartDrawerEnabled;
    if (dto.freeShippingThreshold !== undefined)
      settingsData.freeShippingThreshold = dto.freeShippingThreshold;
    if (dto.multiCurrencyEnabled !== undefined)
      settingsData.multiCurrencyEnabled = dto.multiCurrencyEnabled;
    if (dto.displayCurrency !== undefined)
      settingsData.displayCurrency = dto.displayCurrency;
    if (dto.widgetPrimaryColor !== undefined)
      settingsData.widgetPrimaryColor = dto.widgetPrimaryColor;
    if (dto.widgetPrimaryColorHover !== undefined)
      settingsData.widgetPrimaryColorHover = dto.widgetPrimaryColorHover;
    if (dto.widgetTextColor !== undefined)
      settingsData.widgetTextColor = dto.widgetTextColor;
    if (dto.widgetCardBackground !== undefined)
      settingsData.widgetCardBackground = dto.widgetCardBackground;
    if (dto.widgetBadgeBackground !== undefined)
      settingsData.widgetBadgeBackground = dto.widgetBadgeBackground;
    if (dto.widgetBadgeTextColor !== undefined)
      settingsData.widgetBadgeTextColor = dto.widgetBadgeTextColor;
    if (dto.widgetBorderRadius !== undefined)
      settingsData.widgetBorderRadius = dto.widgetBorderRadius;
    if (dto.widgetButtonText !== undefined)
      settingsData.widgetButtonText = dto.widgetButtonText;
    if (dto.widgetLayout !== undefined)
      settingsData.widgetLayout = dto.widgetLayout;
    if (dto.widgetCustomCss !== undefined)
      settingsData.widgetCustomCss = dto.widgetCustomCss;
    if (dto.widgetFontSize !== undefined)
      settingsData.widgetFontSize = dto.widgetFontSize;
    if (dto.widgetFontWeight !== undefined)
      settingsData.widgetFontWeight = dto.widgetFontWeight;
    if (dto.widgetBorderColor !== undefined)
      settingsData.widgetBorderColor = dto.widgetBorderColor;
    if (dto.widgetSecondaryTextColor !== undefined)
      settingsData.widgetSecondaryTextColor = dto.widgetSecondaryTextColor;
    if (dto.widgetShowSavings !== undefined)
      settingsData.widgetShowSavings = dto.widgetShowSavings;
    if (dto.widgetShowCompareAtPrice !== undefined)
      settingsData.widgetShowCompareAtPrice = dto.widgetShowCompareAtPrice;
    if (dto.widgetCardShadow !== undefined)
      settingsData.widgetCardShadow = dto.widgetCardShadow;
    if (dto.widgetBlockTitleFontSize !== undefined)
      settingsData.widgetBlockTitleFontSize = dto.widgetBlockTitleFontSize;
    if (dto.widgetBlockTitleFontWeight !== undefined)
      settingsData.widgetBlockTitleFontWeight = dto.widgetBlockTitleFontWeight;
    if (dto.widgetItemTitleFontSize !== undefined)
      settingsData.widgetItemTitleFontSize = dto.widgetItemTitleFontSize;
    if (dto.widgetItemTitleFontWeight !== undefined)
      settingsData.widgetItemTitleFontWeight = dto.widgetItemTitleFontWeight;
    if (dto.widgetSubtitleFontSize !== undefined)
      settingsData.widgetSubtitleFontSize = dto.widgetSubtitleFontSize;
    if (dto.widgetSubtitleFontWeight !== undefined)
      settingsData.widgetSubtitleFontWeight = dto.widgetSubtitleFontWeight;
    if (dto.widgetPriceFontSize !== undefined)
      settingsData.widgetPriceFontSize = dto.widgetPriceFontSize;
    if (dto.widgetPriceFontWeight !== undefined)
      settingsData.widgetPriceFontWeight = dto.widgetPriceFontWeight;
    if (dto.widgetBadgeFontSize !== undefined)
      settingsData.widgetBadgeFontSize = dto.widgetBadgeFontSize;
    if (dto.widgetBadgeFontWeight !== undefined)
      settingsData.widgetBadgeFontWeight = dto.widgetBadgeFontWeight;
    if (dto.widgetButtonFontSize !== undefined)
      settingsData.widgetButtonFontSize = dto.widgetButtonFontSize;
    if (dto.widgetButtonFontWeight !== undefined)
      settingsData.widgetButtonFontWeight = dto.widgetButtonFontWeight;
    if (dto.widgetSelectedBgColor !== undefined)
      settingsData.widgetSelectedBgColor = dto.widgetSelectedBgColor;
    if (dto.widgetBlockTitleColor !== undefined)
      settingsData.widgetBlockTitleColor = dto.widgetBlockTitleColor;
    if (dto.widgetTitleColor !== undefined)
      settingsData.widgetTitleColor = dto.widgetTitleColor;
    if (dto.widgetSubtitleColor !== undefined)
      settingsData.widgetSubtitleColor = dto.widgetSubtitleColor;
    if (dto.widgetPriceColor !== undefined)
      settingsData.widgetPriceColor = dto.widgetPriceColor;
    if (dto.widgetOriginalPriceColor !== undefined)
      settingsData.widgetOriginalPriceColor = dto.widgetOriginalPriceColor;
    if (dto.widgetLabelBgColor !== undefined)
      settingsData.widgetLabelBgColor = dto.widgetLabelBgColor;
    if (dto.widgetLabelTextColor !== undefined)
      settingsData.widgetLabelTextColor = dto.widgetLabelTextColor;
    if (dto.widgetButtonTextColor !== undefined)
      settingsData.widgetButtonTextColor = dto.widgetButtonTextColor;
    if (dto.widgetSavingsBadgeBgColor !== undefined)
      settingsData.widgetSavingsBadgeBgColor = dto.widgetSavingsBadgeBgColor;
    if (dto.widgetSavingsBadgeTextColor !== undefined)
      settingsData.widgetSavingsBadgeTextColor = dto.widgetSavingsBadgeTextColor;
    if (dto.widgetCardHoverBgColor !== undefined)
      settingsData.widgetCardHoverBgColor = dto.widgetCardHoverBgColor;
    if (dto.widgetGiftBgColor !== undefined)
      settingsData.widgetGiftBgColor = dto.widgetGiftBgColor;
    if (dto.widgetGiftTextColor !== undefined)
      settingsData.widgetGiftTextColor = dto.widgetGiftTextColor;
    if (dto.widgetGiftSelectedBgColor !== undefined)
      settingsData.widgetGiftSelectedBgColor = dto.widgetGiftSelectedBgColor;
    if (dto.widgetGiftSelectedTextColor !== undefined)
      settingsData.widgetGiftSelectedTextColor = dto.widgetGiftSelectedTextColor;
    if (dto.widgetUpsellBgColor !== undefined)
      settingsData.widgetUpsellBgColor = dto.widgetUpsellBgColor;
    if (dto.widgetUpsellTextColor !== undefined)
      settingsData.widgetUpsellTextColor = dto.widgetUpsellTextColor;
    if (dto.widgetUpsellSelectedBgColor !== undefined)
      settingsData.widgetUpsellSelectedBgColor = dto.widgetUpsellSelectedBgColor;
    if (dto.widgetUpsellSelectedTextColor !== undefined)
      settingsData.widgetUpsellSelectedTextColor = dto.widgetUpsellSelectedTextColor;
    if (dto.widgetLabelFontSize !== undefined)
      settingsData.widgetLabelFontSize = dto.widgetLabelFontSize;
    if (dto.widgetLabelFontWeight !== undefined)
      settingsData.widgetLabelFontWeight = dto.widgetLabelFontWeight;
    if (dto.widgetGiftFontSize !== undefined)
      settingsData.widgetGiftFontSize = dto.widgetGiftFontSize;
    if (dto.widgetGiftFontWeight !== undefined)
      settingsData.widgetGiftFontWeight = dto.widgetGiftFontWeight;
    if (dto.widgetUpsellFontSize !== undefined)
      settingsData.widgetUpsellFontSize = dto.widgetUpsellFontSize;
    if (dto.widgetUpsellFontWeight !== undefined)
      settingsData.widgetUpsellFontWeight = dto.widgetUpsellFontWeight;
    if (dto.widgetUnitLabelFontSize !== undefined)
      settingsData.widgetUnitLabelFontSize = dto.widgetUnitLabelFontSize;
    if (dto.widgetUnitLabelFontWeight !== undefined)
      settingsData.widgetUnitLabelFontWeight = dto.widgetUnitLabelFontWeight;
    if (dto.widgetSpacing !== undefined)
      settingsData.widgetSpacing = dto.widgetSpacing;
    if (dto.stickyBarEnabled !== undefined)
      settingsData.stickyBarEnabled = dto.stickyBarEnabled;
    if (dto.stickyBarBgColor !== undefined)
      settingsData.stickyBarBgColor = dto.stickyBarBgColor;
    if (dto.stickyBarTextColor !== undefined)
      settingsData.stickyBarTextColor = dto.stickyBarTextColor;
    if (dto.stickyBarButtonBgColor !== undefined)
      settingsData.stickyBarButtonBgColor = dto.stickyBarButtonBgColor;
    if (dto.stickyBarButtonTextColor !== undefined)
      settingsData.stickyBarButtonTextColor = dto.stickyBarButtonTextColor;
    if (dto.stickyBarButtonText !== undefined)
      settingsData.stickyBarButtonText = dto.stickyBarButtonText;
    if (dto.stickyBarTitleFontSize !== undefined)
      settingsData.stickyBarTitleFontSize = dto.stickyBarTitleFontSize;
    if (dto.stickyBarTitleFontWeight !== undefined)
      settingsData.stickyBarTitleFontWeight = dto.stickyBarTitleFontWeight;
    if (dto.stickyBarButtonFontSize !== undefined)
      settingsData.stickyBarButtonFontSize = dto.stickyBarButtonFontSize;
    if (dto.stickyBarButtonFontWeight !== undefined)
      settingsData.stickyBarButtonFontWeight = dto.stickyBarButtonFontWeight;
    if (dto.stickyBarButtonPadding !== undefined)
      settingsData.stickyBarButtonPadding = dto.stickyBarButtonPadding;
    if (dto.stickyBarButtonBorderRadius !== undefined)
      settingsData.stickyBarButtonBorderRadius = dto.stickyBarButtonBorderRadius;
    if (dto.cartTimerMinutes !== undefined)
      settingsData.cartTimerMinutes = dto.cartTimerMinutes;
    if (dto.cartTimerText !== undefined)
      settingsData.cartTimerText = dto.cartTimerText;
    if (dto.priceRoundingEnabled !== undefined)
      settingsData.priceRoundingEnabled = dto.priceRoundingEnabled;
    if (dto.updateThemePrice !== undefined)
      settingsData.updateThemePrice = dto.updateThemePrice;
    if (dto.themePriceMode !== undefined)
      settingsData.themePriceMode = dto.themePriceMode;
    if (dto.excludeB2B !== undefined)
      settingsData.excludeB2B = dto.excludeB2B;
    if (dto.discountOnlyViaWidget !== undefined)
      settingsData.discountOnlyViaWidget = dto.discountOnlyViaWidget;

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
      cartDrawerEnabled: settings.cartDrawerEnabled,
      freeShippingThreshold: settings.freeShippingThreshold
        ? Number(settings.freeShippingThreshold)
        : null,
      multiCurrencyEnabled: settings.multiCurrencyEnabled,
      displayCurrency: settings.displayCurrency ?? '',
      widgetPrimaryColor: settings.widgetPrimaryColor,
      widgetPrimaryColorHover: settings.widgetPrimaryColorHover,
      widgetTextColor: settings.widgetTextColor,
      widgetCardBackground: settings.widgetCardBackground,
      widgetBadgeBackground: settings.widgetBadgeBackground,
      widgetBadgeTextColor: settings.widgetBadgeTextColor,
      widgetBorderRadius: settings.widgetBorderRadius,
      widgetButtonText: settings.widgetButtonText,
      widgetLayout: settings.widgetLayout,
      widgetCustomCss: settings.widgetCustomCss ?? null,
      widgetFontSize: settings.widgetFontSize,
      widgetFontWeight: settings.widgetFontWeight,
      widgetBorderColor: settings.widgetBorderColor,
      widgetSecondaryTextColor: settings.widgetSecondaryTextColor,
      widgetShowSavings: settings.widgetShowSavings,
      widgetShowCompareAtPrice: settings.widgetShowCompareAtPrice,
      widgetCardShadow: settings.widgetCardShadow,
      widgetBlockTitleFontSize: settings.widgetBlockTitleFontSize ?? 18,
      widgetBlockTitleFontWeight: settings.widgetBlockTitleFontWeight ?? 'bold',
      widgetItemTitleFontSize: settings.widgetItemTitleFontSize ?? 14,
      widgetItemTitleFontWeight: settings.widgetItemTitleFontWeight ?? 'normal',
      widgetSubtitleFontSize: settings.widgetSubtitleFontSize ?? 13,
      widgetSubtitleFontWeight: settings.widgetSubtitleFontWeight ?? 'normal',
      widgetPriceFontSize: settings.widgetPriceFontSize ?? 16,
      widgetPriceFontWeight: settings.widgetPriceFontWeight ?? 'bold',
      widgetBadgeFontSize: settings.widgetBadgeFontSize ?? 12,
      widgetBadgeFontWeight: settings.widgetBadgeFontWeight ?? 'bold',
      widgetButtonFontSize: settings.widgetButtonFontSize ?? 14,
      widgetButtonFontWeight: settings.widgetButtonFontWeight ?? 'bold',
      widgetSelectedBgColor: settings.widgetSelectedBgColor ?? '#eff6ff',
      widgetBlockTitleColor: settings.widgetBlockTitleColor ?? '#111827',
      widgetTitleColor: settings.widgetTitleColor ?? '#111827',
      widgetSubtitleColor: settings.widgetSubtitleColor ?? '#6b7280',
      widgetPriceColor: settings.widgetPriceColor ?? '#111827',
      widgetOriginalPriceColor: settings.widgetOriginalPriceColor ?? '#9ca3af',
      widgetLabelBgColor: settings.widgetLabelBgColor ?? '#e0e7ff',
      widgetLabelTextColor: settings.widgetLabelTextColor ?? '#3730a3',
      widgetButtonTextColor: settings.widgetButtonTextColor ?? '#ffffff',
      widgetSavingsBadgeBgColor: settings.widgetSavingsBadgeBgColor ?? '#dcfce7',
      widgetSavingsBadgeTextColor: settings.widgetSavingsBadgeTextColor ?? '#166534',
      widgetCardHoverBgColor: settings.widgetCardHoverBgColor ?? '#f9fafb',
      widgetGiftBgColor: settings.widgetGiftBgColor ?? '#fef9c3',
      widgetGiftTextColor: settings.widgetGiftTextColor ?? '#854d0e',
      widgetGiftSelectedBgColor: settings.widgetGiftSelectedBgColor ?? '#fef08a',
      widgetGiftSelectedTextColor: settings.widgetGiftSelectedTextColor ?? '#713f12',
      widgetUpsellBgColor: settings.widgetUpsellBgColor ?? '#f0fdf4',
      widgetUpsellTextColor: settings.widgetUpsellTextColor ?? '#166534',
      widgetUpsellSelectedBgColor: settings.widgetUpsellSelectedBgColor ?? '#dcfce7',
      widgetUpsellSelectedTextColor: settings.widgetUpsellSelectedTextColor ?? '#14532d',
      widgetLabelFontSize: settings.widgetLabelFontSize ?? 11,
      widgetLabelFontWeight: settings.widgetLabelFontWeight ?? 'bold',
      widgetGiftFontSize: settings.widgetGiftFontSize ?? 13,
      widgetGiftFontWeight: settings.widgetGiftFontWeight ?? 'normal',
      widgetUpsellFontSize: settings.widgetUpsellFontSize ?? 13,
      widgetUpsellFontWeight: settings.widgetUpsellFontWeight ?? 'normal',
      widgetUnitLabelFontSize: settings.widgetUnitLabelFontSize ?? 13,
      widgetUnitLabelFontWeight: settings.widgetUnitLabelFontWeight ?? 'bold',
      widgetSpacing: settings.widgetSpacing ?? 12,
      stickyBarEnabled: settings.stickyBarEnabled ?? false,
      stickyBarBgColor: settings.stickyBarBgColor ?? '#ffffff',
      stickyBarTextColor: settings.stickyBarTextColor ?? '#111827',
      stickyBarButtonBgColor: settings.stickyBarButtonBgColor ?? '#2563eb',
      stickyBarButtonTextColor: settings.stickyBarButtonTextColor ?? '#ffffff',
      stickyBarButtonText: settings.stickyBarButtonText ?? 'Choose Bundle',
      stickyBarTitleFontSize: settings.stickyBarTitleFontSize ?? 14,
      stickyBarTitleFontWeight: settings.stickyBarTitleFontWeight ?? 'normal',
      stickyBarButtonFontSize: settings.stickyBarButtonFontSize ?? 14,
      stickyBarButtonFontWeight: settings.stickyBarButtonFontWeight ?? 'bold',
      stickyBarButtonPadding: settings.stickyBarButtonPadding ?? 15,
      stickyBarButtonBorderRadius: settings.stickyBarButtonBorderRadius ?? 8,
      cartTimerMinutes: settings.cartTimerMinutes ?? 0,
      cartTimerText: settings.cartTimerText ?? 'Your cart will expire in {{timer}}',
      priceRoundingEnabled: settings.priceRoundingEnabled ?? false,
      updateThemePrice: settings.updateThemePrice ?? false,
      themePriceMode: settings.themePriceMode ?? 'per_item',
      excludeB2B: settings.excludeB2B ?? false,
      discountOnlyViaWidget: settings.discountOnlyViaWidget ?? false,
      defaultShippingCost: Number(shop.defaultShippingCost),
      paymentProcessingPct: Number(shop.paymentProcessingPct),
      paymentProcessingFlat: Number(shop.paymentProcessingFlat),
    };
  }
}
