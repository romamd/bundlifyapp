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
  ) {
    if (!shop) {
      throw new BadRequestException('shop query parameter is required');
    }

    return this.storefrontService.getBundlesForStorefront(
      shop,
      productId,
      trigger,
    );
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
