import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import type { TrackEventDto } from '@bundlify/shared-types';

@Controller('api/storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('bundles')
  async getBundles(
    @Query('shop') shop: string,
    @Query('product_id') productId?: string,
    @Query('trigger') trigger?: string,
    @Query('session_id') sessionId?: string,
  ) {
    if (!shop) {
      throw new BadRequestException('shop query parameter is required');
    }

    return this.storefrontService.getBundlesForStorefront(
      shop,
      productId,
      trigger,
      sessionId,
    );
  }

  @Get('cart-drawer')
  async getCartDrawer(
    @Query('shop') shop: string,
    @Query('cart_value') cartValue?: string,
    @Query('product_ids') productIds?: string,
    @Query('session_id') sessionId?: string,
  ) {
    if (!shop) {
      throw new BadRequestException('shop query parameter is required');
    }

    return this.storefrontService.getCartDrawerData(
      shop,
      cartValue ? parseFloat(cartValue) : 0,
      productIds ? productIds.split(',').filter(Boolean) : [],
      sessionId,
    );
  }

  @Get('theme')
  async getThemeSettings(@Query('shop') shop: string) {
    if (!shop) {
      throw new BadRequestException('shop query parameter is required');
    }

    return this.storefrontService.getThemeSettings(shop);
  }

  @Post('events')
  async trackEvent(
    @Query('shop') shop: string,
    @Body() data: TrackEventDto,
  ) {
    if (!shop) {
      throw new BadRequestException('shop query parameter is required');
    }

    await this.storefrontService.trackEvent(shop, data);
    return { success: true };
  }
}
