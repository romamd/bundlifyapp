import { Injectable } from '@nestjs/common';
import { PrismaService, Prisma, Shop } from '@bundlify/prisma-client';
import type { ProductDto, BulkCogsRow } from '@bundlify/shared-types';
import { UpdateCogsRequestDto } from './dto/update-cogs.dto';

interface ProductFilters {
  search?: string;
  deadStockOnly?: boolean;
  missingCogsOnly?: boolean;
  sortBy?: 'title' | 'margin' | 'daysWithoutSale' | 'price';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(
    shopId: string,
    filters: ProductFilters,
  ): Promise<{ items: ProductDto[]; total: number }> {
    const {
      search = '',
      deadStockOnly = false,
      missingCogsOnly = false,
      sortBy = 'title',
      sortDir = 'asc',
      page = 1,
      pageSize = 25,
    } = filters;

    const where: Prisma.ProductWhereInput = {
      shopId,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { sku: { contains: search } },
        ],
      }),
      ...(deadStockOnly && { isDeadStock: true }),
      ...(missingCogsOnly && { cogs: null }),
    };

    const orderByMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
      title: { title: sortDir },
      margin: { contributionMarginPct: sortDir },
      daysWithoutSale: { daysWithoutSale: sortDir },
      price: { price: sortDir },
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: orderByMap[sortBy] || { title: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map(this.toDto),
      total,
    };
  }

  async getProduct(shopId: string, productId: string): Promise<ProductDto> {
    const product = await this.prisma.product.findFirstOrThrow({
      where: { id: productId, shopId },
    });
    return this.toDto(product);
  }

  async updateCogs(
    shopId: string,
    productId: string,
    data: UpdateCogsRequestDto,
  ): Promise<ProductDto> {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.cogs !== undefined && { cogs: data.cogs }),
        ...(data.shippingCost !== undefined && {
          shippingCost: data.shippingCost,
        }),
        ...(data.additionalCosts !== undefined && {
          additionalCosts: data.additionalCosts,
        }),
      },
    });

    return this.toDto(product);
  }

  async bulkImportCogs(
    shopId: string,
    rows: BulkCogsRow[],
  ): Promise<{ matched: number; unmatched: number }> {
    let matched = 0;
    let unmatched = 0;

    for (const row of rows) {
      const result = await this.prisma.product.updateMany({
        where: { shopId, sku: row.sku },
        data: {
          cogs: row.cogs,
          ...(row.shippingCost !== undefined && {
            shippingCost: row.shippingCost,
          }),
          ...(row.additionalCosts !== undefined && {
            additionalCosts: row.additionalCosts,
          }),
        },
      });

      if (result.count > 0) {
        matched += result.count;
      } else {
        unmatched++;
      }
    }

    return { matched, unmatched };
  }

  private toDto(product: any): ProductDto {
    return {
      id: product.id,
      shopifyProductId: product.shopifyProductId,
      shopifyVariantId: product.shopifyVariantId,
      title: product.title,
      variantTitle: product.variantTitle,
      sku: product.sku,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      cogs: product.cogs ? Number(product.cogs) : null,
      shippingCost: product.shippingCost
        ? Number(product.shippingCost)
        : null,
      additionalCosts: product.additionalCosts
        ? Number(product.additionalCosts)
        : null,
      contributionMargin: product.contributionMargin
        ? Number(product.contributionMargin)
        : null,
      contributionMarginPct: product.contributionMarginPct
        ? Number(product.contributionMarginPct)
        : null,
      inventoryQuantity: product.inventoryQuantity,
      avgDailySales: Number(product.avgDailySales),
      daysWithoutSale: product.daysWithoutSale,
      isDeadStock: product.isDeadStock,
      imageUrl: product.imageUrl,
      status: product.status,
    };
  }
}
