import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AffinityService {
  private readonly logger = new Logger(AffinityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async calculateAffinities(shopId: string): Promise<number> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });

    const accessToken = await this.authService.getDecryptedAccessToken(shopId);

    // Fetch orders from last 90 days via Shopify GraphQL
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const orders = await this.fetchRecentOrders(
      shop.shopifyDomain,
      accessToken,
      ninetyDaysAgo,
    );

    if (orders.length === 0) {
      this.logger.log(`No orders found for shop ${shop.shopifyDomain} in last 90 days`);
      return 0;
    }

    // Build co-occurrence matrix
    const coOccurrences = new Map<string, number>();
    const productSales = new Map<string, number>();

    for (const order of orders) {
      const productIds = order.lineItems
        .map((li: any) => String(li.product_id))
        .filter((id: string) => id && id !== 'null');

      const uniqueIds: string[] = [...new Set<string>(productIds)];

      for (const id of uniqueIds) {
        productSales.set(id, (productSales.get(id) || 0) + 1);
      }

      // Generate pairs
      for (let i = 0; i < uniqueIds.length; i++) {
        for (let j = i + 1; j < uniqueIds.length; j++) {
          const key = [uniqueIds[i], uniqueIds[j]].sort().join('::');
          coOccurrences.set(key, (coOccurrences.get(key) || 0) + 1);
        }
      }
    }

    // Calculate affinity scores and upsert
    let upsertCount = 0;

    for (const [key, count] of coOccurrences) {
      const [shopifyIdA, shopifyIdB] = key.split('::');

      const productA = await this.prisma.product.findFirst({
        where: { shopId, shopifyProductId: shopifyIdA },
      });
      const productB = await this.prisma.product.findFirst({
        where: { shopId, shopifyProductId: shopifyIdB },
      });

      if (!productA || !productB) continue;

      const salesA = productSales.get(shopifyIdA) || 1;
      const salesB = productSales.get(shopifyIdB) || 1;
      const affinityScore = count / Math.sqrt(salesA * salesB);

      await this.prisma.productAffinity.upsert({
        where: {
          shopId_productAId_productBId: {
            shopId,
            productAId: productA.id,
            productBId: productB.id,
          },
        },
        update: {
          coOccurrences: count,
          affinityScore,
          lastCalculatedAt: new Date(),
        },
        create: {
          shopId,
          productAId: productA.id,
          productBId: productB.id,
          coOccurrences: count,
          affinityScore,
        },
      });

      upsertCount++;
    }

    this.logger.log(
      `Calculated ${upsertCount} affinity pairs for shop ${shop.shopifyDomain} from ${orders.length} orders`,
    );

    return upsertCount;
  }

  async getTopAffinities(
    shopId: string,
    minScore: number = 0.3,
    limit: number = 20,
  ) {
    return this.prisma.productAffinity.findMany({
      where: {
        shopId,
        affinityScore: { gte: minScore },
      },
      include: {
        productA: true,
        productB: true,
      },
      orderBy: { affinityScore: 'desc' },
      take: limit,
    });
  }

  private async fetchRecentOrders(
    shopDomain: string,
    accessToken: string,
    since: Date,
  ): Promise<any[]> {
    const orders: any[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const afterClause: string = cursor ? `, after: "${cursor}"` : '';
      const query: string = `{
        orders(first: 50, query: "created_at:>='${since.toISOString()}'"${afterClause}) {
          edges {
            cursor
            node {
              id
              lineItems(first: 50) {
                edges {
                  node {
                    product {
                      legacyResourceId
                    }
                    quantity
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }`;

      const response: globalThis.Response = await fetch(
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

      if (!response.ok) break;

      const data: any = await response.json();
      const edges: any[] = data?.data?.orders?.edges || [];

      for (const edge of edges as any[]) {
        const lineItems = (edge.node.lineItems?.edges || []).map((e: any) => ({
          product_id: e.node.product?.legacyResourceId,
          quantity: e.node.quantity,
        }));
        orders.push({ lineItems });
        cursor = edge.cursor;
      }

      hasMore = data?.data?.orders?.pageInfo?.hasNextPage ?? false;
    }

    return orders;
  }
}
