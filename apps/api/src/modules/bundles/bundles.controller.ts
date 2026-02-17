import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import type { Shop } from '@bundlify/prisma-client';
import { BundlesService } from './bundles.service';
import { BundleEngineService } from './bundle-engine.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

@Controller('api/admin/bundles')
@UseGuards(ShopifyAuthGuard)
export class BundlesController {
  constructor(
    private readonly bundlesService: BundlesService,
    private readonly bundleEngineService: BundleEngineService,
  ) {}

  @Get()
  async listBundles(@CurrentShop() shop: Shop) {
    return this.bundlesService.listBundles(shop.id);
  }

  @Get(':id')
  async getBundle(@CurrentShop() shop: Shop, @Param('id') id: string) {
    return this.bundlesService.getBundle(shop.id, id);
  }

  @Post()
  async createBundle(
    @CurrentShop() shop: Shop,
    @Body() dto: CreateBundleDto,
  ) {
    return this.bundlesService.createBundle(shop.id, dto);
  }

  @Put(':id')
  async updateBundle(
    @CurrentShop() shop: Shop,
    @Param('id') id: string,
    @Body() dto: UpdateBundleDto,
  ) {
    return this.bundlesService.updateBundle(shop.id, id, dto);
  }

  @Delete(':id')
  async deleteBundle(@CurrentShop() shop: Shop, @Param('id') id: string) {
    return this.bundlesService.deleteBundle(shop.id, id);
  }

  @Post('generate')
  async generateBundles(@CurrentShop() shop: Shop) {
    const count = await this.bundleEngineService.generateBundles(shop.id);
    return { generated: count };
  }
}
