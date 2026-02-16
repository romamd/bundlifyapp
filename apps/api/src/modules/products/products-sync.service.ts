import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, Shop } from '@bundlify/prisma-client';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ProductsSyncService {
  private readonly logger = new Logger(ProductsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async fullSync(shop: Shop): Promise<void> {
    const accessToken = await this.authService.getDecryptedAccessToken(
      shop.id,
    );

    this.logger.log(`Starting full product sync for ${shop.shopifyDomain}`);

    let hasNextPage = true;
    let cursor: string | null = null;
    let syncedCount = 0;

    while (hasNextPage) {
      const query = `
        {
          products(first: 250${cursor ? `, after: "${cursor}"` : ''}) {
            edges {
              node {
                id
                title
                status
                updatedAt
                featuredImage { url }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                      compareAtPrice
                      inventoryQuantity
                      inventoryItem { id }
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      const response = await this.shopifyGraphQL(
        shop.shopifyDomain,
        accessToken,
        query,
      );
      const products = response.data?.products;

      if (!products) {
        this.logger.error('Failed to fetch products', response);
        break;
      }

      for (const edge of products.edges) {
        const product = edge.node;
        const shopifyProductId = product.id.replace(
          'gid://shopify/Product/',
          '',
        );

        for (const variantEdge of product.variants.edges) {
          const variant = variantEdge.node;
          const shopifyVariantId = variant.id.replace(
            'gid://shopify/ProductVariant/',
            '',
          );

          await this.prisma.product.upsert({
            where: {
              shopId_shopifyProductId_shopifyVariantId: {
                shopId: shop.id,
                shopifyProductId,
                shopifyVariantId,
              },
            },
            update: {
              title: product.title,
              variantTitle:
                variant.title !== 'Default Title' ? variant.title : null,
              sku: variant.sku || null,
              price: parseFloat(variant.price),
              compareAtPrice: variant.compareAtPrice
                ? parseFloat(variant.compareAtPrice)
                : null,
              inventoryQuantity: variant.inventoryQuantity ?? 0,
              inventoryItemId: variant.inventoryItem?.id
                ? variant.inventoryItem.id.replace(
                    'gid://shopify/InventoryItem/',
                    '',
                  )
                : null,
              imageUrl: product.featuredImage?.url || null,
              status:
                product.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
              shopifyUpdatedAt: new Date(product.updatedAt),
              lastSyncedAt: new Date(),
            },
            create: {
              shopId: shop.id,
              shopifyProductId,
              shopifyVariantId,
              title: product.title,
              variantTitle:
                variant.title !== 'Default Title' ? variant.title : null,
              sku: variant.sku || null,
              price: parseFloat(variant.price),
              compareAtPrice: variant.compareAtPrice
                ? parseFloat(variant.compareAtPrice)
                : null,
              inventoryQuantity: variant.inventoryQuantity ?? 0,
              inventoryItemId: variant.inventoryItem?.id
                ? variant.inventoryItem.id.replace(
                    'gid://shopify/InventoryItem/',
                    '',
                  )
                : null,
              imageUrl: product.featuredImage?.url || null,
              status:
                product.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
              shopifyUpdatedAt: new Date(product.updatedAt),
              lastSyncedAt: new Date(),
            },
          });
          syncedCount++;
        }
      }

      hasNextPage = products.pageInfo.hasNextPage;
      if (products.edges.length > 0) {
        cursor = products.edges[products.edges.length - 1].cursor;
      }
    }

    this.logger.log(
      `Synced ${syncedCount} variants for ${shop.shopifyDomain}`,
    );
  }

  private async shopifyGraphQL(
    shopDomain: string,
    accessToken: string,
    query: string,
  ): Promise<any> {
    const response = await fetch(
      `https://${shopDomain}/admin/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Shopify GraphQL error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }
}
