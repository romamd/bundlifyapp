import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import type { CogsSyncResult } from './quickbooks.provider';

@Injectable()
export class XeroProvider {
  private readonly logger = new Logger(XeroProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  getAuthUrl(shopId: string, redirectUri: string): string {
    const clientId = process.env.XERO_CLIENT_ID || '';
    const scopes = 'openid accounting.read';
    return (
      `https://login.xero.com/identity/connect/authorize?` +
      `client_id=${clientId}&scope=${encodeURIComponent(scopes)}` +
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
    tenantId: string;
  }> {
    const clientId = process.env.XERO_CLIENT_ID || '';
    const clientSecret = process.env.XERO_CLIENT_SECRET || '';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch(
      'https://identity.xero.com/connect/token',
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

    if (!tokenResponse.ok) {
      throw new Error(`Xero token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    // Get tenant ID from connections endpoint
    const connectionsResponse = await fetch(
      'https://api.xero.com/connections',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    const connections = await connectionsResponse.json();
    const tenantId = connections[0]?.tenantId || '';

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tenantId,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const clientId = process.env.XERO_CLIENT_ID || '';
    const clientSecret = process.env.XERO_CLIENT_SECRET || '';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(
      'https://identity.xero.com/connect/token',
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
      throw new Error(`Xero token refresh failed: ${response.status}`);
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
    tenantId: string,
    shopId: string,
  ): Promise<CogsSyncResult> {
    const result: CogsSyncResult = { matched: 0, unmatched: 0, errors: [] };

    try {
      const response = await fetch(
        'https://api.xero.com/api.xro/2.0/Items',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Xero-Tenant-Id': tenantId,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        result.errors.push(`Xero API error: ${response.status}`);
        return result;
      }

      const data = await response.json();
      const items = data?.Items || [];

      for (const item of items) {
        const sku = item.Code;
        if (!sku) continue;

        const purchaseCost = item.PurchaseDetails?.UnitPrice ?? null;
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
