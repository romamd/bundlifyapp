import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CollectionsService } from './collections.service';
import type { Shop } from '@bundlify/prisma-client';

@Controller('api/admin/collections')
@UseGuards(ShopifyAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async listCollections(
    @CurrentShop() shop: Shop,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.collectionsService.listCollections(shop, {
      search,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
  }
}
