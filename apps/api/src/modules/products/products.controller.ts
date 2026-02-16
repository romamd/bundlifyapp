import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { ProductsService } from './products.service';
import { MarginService } from '../margin/margin.service';
import { UpdateCogsRequestDto } from './dto/update-cogs.dto';
import { BulkImportCogsRequestDto } from './dto/bulk-import-cogs.dto';
import type { Shop } from '@bundlify/prisma-client';

@Controller('api/admin/products')
@UseGuards(ShopifyAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly marginService: MarginService,
  ) {}

  @Get()
  async listProducts(
    @CurrentShop() shop: Shop,
    @Query('search') search?: string,
    @Query('deadStockOnly') deadStockOnly?: string,
    @Query('missingCogsOnly') missingCogsOnly?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.productsService.listProducts(shop.id, {
      search,
      deadStockOnly: deadStockOnly === 'true',
      missingCogsOnly: missingCogsOnly === 'true',
      sortBy: sortBy as any,
      sortDir: sortDir as any,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 25,
    });
  }

  @Put(':id/costs')
  async updateCogs(
    @CurrentShop() shop: Shop,
    @Param('id') id: string,
    @Body() dto: UpdateCogsRequestDto,
  ) {
    const product = await this.productsService.updateCogs(shop.id, id, dto);

    // Recalculate margin after COGS update
    await this.marginService.recalculateProductMargin(id, shop.id);

    // Return updated product with new margin
    return this.productsService.getProduct(shop.id, id);
  }

  @Post('import')
  async bulkImportCogs(
    @CurrentShop() shop: Shop,
    @Body() dto: BulkImportCogsRequestDto,
  ) {
    const result = await this.productsService.bulkImportCogs(
      shop.id,
      dto.rows,
    );

    // Recalculate all margins after bulk import
    await this.marginService.recalculateAllMargins(shop.id);

    return result;
  }
}
