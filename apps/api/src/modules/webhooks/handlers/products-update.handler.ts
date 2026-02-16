import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';

@Injectable()
export class ProductsUpdateHandler {
  private readonly logger = new Logger(ProductsUpdateHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(shopDomain: string, payload: any) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    if (!shop) {
      this.logger.warn(`Shop not found: ${shopDomain}`);
      return;
    }

    const shopifyProductId = String(payload.id);

    for (const variant of payload.variants || []) {
      await this.prisma.product.upsert({
        where: {
          shopId_shopifyProductId_shopifyVariantId: {
            shopId: shop.id,
            shopifyProductId,
            shopifyVariantId: String(variant.id),
          },
        },
        update: {
          title: payload.title,
          variantTitle: variant.title !== 'Default Title' ? variant.title : null,
          sku: variant.sku || null,
          price: variant.price,
          compareAtPrice: variant.compare_at_price || null,
          inventoryQuantity: variant.inventory_quantity ?? 0,
          inventoryItemId: variant.inventory_item_id
            ? String(variant.inventory_item_id)
            : null,
          imageUrl: payload.image?.src || null,
          status: payload.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
          shopifyUpdatedAt: new Date(payload.updated_at),
          lastSyncedAt: new Date(),
        },
        create: {
          shopId: shop.id,
          shopifyProductId,
          shopifyVariantId: String(variant.id),
          title: payload.title,
          variantTitle: variant.title !== 'Default Title' ? variant.title : null,
          sku: variant.sku || null,
          price: variant.price,
          compareAtPrice: variant.compare_at_price || null,
          inventoryQuantity: variant.inventory_quantity ?? 0,
          inventoryItemId: variant.inventory_item_id
            ? String(variant.inventory_item_id)
            : null,
          imageUrl: payload.image?.src || null,
          status: payload.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
          shopifyUpdatedAt: new Date(payload.updated_at),
          lastSyncedAt: new Date(),
        },
      });
    }

    this.logger.log(
      `Product ${shopifyProductId} synced for shop ${shopDomain}`,
    );
  }
}
