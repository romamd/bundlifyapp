import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';

export interface CogsSyncResult {
  matched: number;
  unmatched: number;
  errors: string[];
}

@Injectable()
export class QuickBooksProvider {
  private readonly logger = new Logger(QuickBooksProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  getAuthUrl(shopId: string, redirectUri: string): string {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID || '';
    const scopes = 'com.intuit.quickbooks.accounting';
    return (
      `https://appcenter.intuit.com/connect/oauth2?` +
      `client_id=${clientId}&scope=${scopes}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&state=${shopId}`
    );
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    realmId: string;
  }> {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID || '';
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || '';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`QuickBooks token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      realmId: data.realmId || '',
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID || '';
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || '';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`QuickBooks token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async syncCogs(
    accessToken: string,
    realmId: string,
    shopId: string,
  ): Promise<CogsSyncResult> {
    const baseUrl =
      process.env.QUICKBOOKS_API_URL ||
      'https://quickbooks.api.intuit.com';
    const result: CogsSyncResult = { matched: 0, unmatched: 0, errors: [] };

    try {
      const response = await fetch(
        `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent("SELECT * FROM Item WHERE Type = 'Inventory' MAXRESULTS 1000")}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        result.errors.push(`QBO API error: ${response.status}`);
        return result;
      }

      const data = await response.json();
      const items = data?.QueryResponse?.Item || [];

      for (const item of items) {
        const sku = item.Sku;
        if (!sku) continue;

        const purchaseCost = item.PurchaseCost ?? item.UnitPrice ?? null;
        if (purchaseCost === null) continue;

        const product = await this.prisma.product.findFirst({
          where: { shopId, sku },
        });

        if (product) {
          await this.prisma.product.update({
            where: { id: product.id },
            data: { cogs: purchaseCost },
          });
          result.matched++;
        } else {
          result.unmatched++;
        }
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : String(error),
      );
    }

    return result;
  }
}
