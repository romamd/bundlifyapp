import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, Shop } from '@bundlify/prisma-client';
import { AuthService } from '../auth/auth.service';

export interface CollectionDto {
  id: string;
  handle: string;
  title: string;
  imageUrl: string | null;
  productsCount: number;
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async listCollections(
    shop: Shop,
    filters: { search?: string; page?: number; pageSize?: number },
  ): Promise<{ items: CollectionDto[]; total: number }> {
    const { search = '', page = 1, pageSize = 10 } = filters;
    const accessToken = await this.authService.getDecryptedAccessToken(shop.id);

    const queryFilter = search ? `title:*${search}*` : '';
    const first = pageSize;
    const skip = (page - 1) * pageSize;

    // Fetch more than needed to support offset-based pagination over cursor-based API
    const fetchCount = skip + first;

    const query = `
      {
        collections(first: ${fetchCount}${queryFilter ? `, query: "${queryFilter}"` : ''}) {
          edges {
            node {
              id
              handle
              title
              image { url }
              productsCount { count }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const result = await this.shopifyGraphQL(shop.shopifyDomain, accessToken, query);
    const edges = result?.data?.collections?.edges || [];
    const hasNextPage = result?.data?.collections?.pageInfo?.hasNextPage || false;

    // Slice for offset-based pagination
    const pageEdges = edges.slice(skip, skip + first);

    const items: CollectionDto[] = pageEdges.map((edge: any) => ({
      id: edge.node.id,
      handle: edge.node.handle,
      title: edge.node.title,
      imageUrl: edge.node.image?.url || null,
      productsCount: edge.node.productsCount?.count ?? 0,
    }));

    // Estimate total: if there's a next page, we know there are more
    const total = hasNextPage ? edges.length + 1 : edges.length;

    return { items, total };
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
