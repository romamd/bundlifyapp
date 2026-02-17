import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import { AuthService } from '../auth/auth.service';

const PLAN_PRICES: Record<string, { name: string; price: number }> = {
  STARTER: { name: 'Bundlify Starter', price: 9.99 },
  GROWTH: { name: 'Bundlify Growth', price: 29.99 },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async createCharge(
    shopId: string,
    plan: 'STARTER' | 'GROWTH',
  ): Promise<string> {
    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }

    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });

    const accessToken = await this.authService.getDecryptedAccessToken(shopId);

    const returnUrl = `${process.env.APP_URL}/api/admin/billing/confirm?shop_id=${shopId}`;

    const mutation = `
      mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          lineItems: $lineItems
          test: ${process.env.NODE_ENV !== 'production'}
        ) {
          appSubscription {
            id
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      name: planConfig.name,
      returnUrl,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: planConfig.price,
                currencyCode: 'USD',
              },
            },
          },
        },
      ],
    };

    const response = await this.shopifyGraphQL(
      shop.shopifyDomain,
      accessToken,
      mutation,
      variables,
    );

    const result = response.data?.appSubscriptionCreate;

    if (result?.userErrors?.length > 0) {
      const errorMsg = result.userErrors
        .map((e: any) => e.message)
        .join(', ');
      throw new BadRequestException(
        `Failed to create subscription: ${errorMsg}`,
      );
    }

    if (!result?.confirmationUrl) {
      throw new BadRequestException(
        'Failed to get confirmation URL from Shopify',
      );
    }

    this.logger.log(
      `Created ${plan} charge for shop ${shop.shopifyDomain}`,
    );

    return result.confirmationUrl;
  }

  async confirmCharge(shopId: string, chargeId: string): Promise<void> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });

    const accessToken = await this.authService.getDecryptedAccessToken(shopId);

    const query = `
      {
        node(id: "${chargeId}") {
          ... on AppSubscription {
            id
            status
            name
          }
        }
      }
    `;

    const response = await this.shopifyGraphQL(
      shop.shopifyDomain,
      accessToken,
      query,
    );

    const subscription = response.data?.node;

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Charge is not active. Status: ${subscription?.status || 'unknown'}`,
      );
    }

    // Determine plan from subscription name
    let plan: 'STARTER' | 'GROWTH' = 'STARTER';
    if (subscription.name?.includes('Growth')) {
      plan = 'GROWTH';
    }

    await this.prisma.shop.update({
      where: { id: shopId },
      data: { plan },
    });

    this.logger.log(
      `Shop ${shop.shopifyDomain} upgraded to ${plan}`,
    );
  }

  private async shopifyGraphQL(
    shopDomain: string,
    accessToken: string,
    query: string,
    variables?: any,
  ): Promise<any> {
    const body: Record<string, any> = { query };
    if (variables) {
      body.variables = variables;
    }

    const response = await fetch(
      `https://${shopDomain}/admin/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify(body),
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
