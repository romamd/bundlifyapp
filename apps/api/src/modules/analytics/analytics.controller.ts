import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { AnalyticsService } from './analytics.service';
import type { Shop } from '@bundlify/prisma-client';

@Controller('api/admin/analytics')
@UseGuards(ShopifyAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(
    @CurrentShop() shop: Shop,
    @Query('range') range?: string,
  ) {
    const validRange = this.parseRange(range);
    return this.analyticsService.getDashboard(shop.id, validRange);
  }

  @Get('bundles')
  async getBundleAnalytics(
    @CurrentShop() shop: Shop,
    @Query('range') range?: string,
  ) {
    const validRange = this.parseRange(range);
    return this.analyticsService.getBundleAnalytics(shop.id, validRange);
  }

  @Get('products')
  async getProductAnalytics(@CurrentShop() shop: Shop) {
    return this.analyticsService.getProductAnalytics(shop.id);
  }

  @Get('product-pairs')
  async getProductPairs(@CurrentShop() shop: Shop) {
    return this.analyticsService.getProductPairs(shop.id);
  }

  private parseRange(range?: string): '7d' | '30d' | '90d' {
    if (range === '7d' || range === '30d' || range === '90d') {
      return range;
    }
    return '30d';
  }
}
