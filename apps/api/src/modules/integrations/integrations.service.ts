import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import { encryptToken, decryptToken } from '../../common/utils/crypto.util';
import { QuickBooksProvider } from './providers/quickbooks.provider';
import { XeroProvider } from './providers/xero.provider';
import { MarginService } from '../margin/margin.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly quickbooks: QuickBooksProvider,
    private readonly xero: XeroProvider,
    private readonly marginService: MarginService,
  ) {
    this.encryptionKey = process.env.TOKEN_ENCRYPTION_KEY!;
  }

  async listIntegrations(shopId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { shopId },
    });

    return integrations.map((i) => ({
      id: i.id,
      provider: i.provider,
      status: i.status,
      lastSyncedAt: i.lastSyncedAt?.toISOString() ?? null,
      syncErrors: i.syncErrors,
    }));
  }

  getConnectUrl(shopId: string, provider: string): string {
    const redirectUri = `${process.env.APP_URL}/api/admin/integrations/${provider}/callback`;

    if (provider === 'quickbooks') {
      return this.quickbooks.getAuthUrl(shopId, redirectUri);
    } else if (provider === 'xero') {
      return this.xero.getAuthUrl(shopId, redirectUri);
    }

    throw new NotFoundException(`Unknown provider: ${provider}`);
  }

  async handleCallback(
    provider: string,
    code: string,
    state: string,
  ): Promise<void> {
    const shopId = state;
    const redirectUri = `${process.env.APP_URL}/api/admin/integrations/${provider}/callback`;

    let accessToken: string;
    let refreshToken: string;
    let expiresIn: number;
    let externalId: string;

    if (provider === 'quickbooks') {
      const result = await this.quickbooks.exchangeCode(code, redirectUri);
      accessToken = result.accessToken;
      refreshToken = result.refreshToken;
      expiresIn = result.expiresIn;
      externalId = result.realmId;
    } else if (provider === 'xero') {
      const result = await this.xero.exchangeCode(code, redirectUri);
      accessToken = result.accessToken;
      refreshToken = result.refreshToken;
      expiresIn = result.expiresIn;
      externalId = result.tenantId;
    } else {
      throw new NotFoundException(`Unknown provider: ${provider}`);
    }

    const encryptedAccess = encryptToken(accessToken, this.encryptionKey);
    const encryptedRefresh = refreshToken
      ? encryptToken(refreshToken, this.encryptionKey)
      : null;

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await this.prisma.integration.upsert({
      where: {
        shopId_provider: {
          shopId,
          provider: provider.toUpperCase() as any,
        },
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt,
        externalId,
        status: 'CONNECTED' as any,
        syncErrors: null,
      },
      create: {
        shopId,
        provider: provider.toUpperCase() as any,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt,
        externalId,
        status: 'CONNECTED' as any,
      },
    });

    this.logger.log(`Integration ${provider} connected for shop ${shopId}`);
  }

  async syncCogs(
    shopId: string,
    provider: string,
  ): Promise<{ matched: number; unmatched: number }> {
    const integration = await this.prisma.integration.findUnique({
      where: {
        shopId_provider: {
          shopId,
          provider: provider.toUpperCase() as any,
        },
      },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${provider} not found`);
    }

    // Refresh token if expired
    let accessToken = decryptToken(
      integration.accessToken,
      this.encryptionKey,
    );
    if (
      integration.tokenExpiresAt &&
      integration.tokenExpiresAt < new Date()
    ) {
      accessToken = await this.refreshTokens(integration);
    }

    let result;

    if (provider === 'quickbooks') {
      result = await this.quickbooks.syncCogs(
        accessToken,
        integration.externalId || '',
        shopId,
      );
    } else if (provider === 'xero') {
      result = await this.xero.syncCogs(
        accessToken,
        integration.externalId || '',
        shopId,
      );
    } else {
      throw new NotFoundException(`Unknown provider: ${provider}`);
    }

    // Recalculate margins for all products that got updated
    await this.marginService.recalculateAllMargins(shopId);

    // Update sync status
    await this.prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncedAt: new Date(),
        status:
          result.errors.length > 0
            ? ('ERROR' as any)
            : ('CONNECTED' as any),
        syncErrors:
          result.errors.length > 0
            ? JSON.stringify(result.errors)
            : null,
      },
    });

    this.logger.log(
      `COGS sync from ${provider}: ${result.matched} matched, ${result.unmatched} unmatched`,
    );

    return { matched: result.matched, unmatched: result.unmatched };
  }

  async disconnect(shopId: string, provider: string): Promise<void> {
    await this.prisma.integration.updateMany({
      where: {
        shopId,
        provider: provider.toUpperCase() as any,
      },
      data: { status: 'DISCONNECTED' as any },
    });
  }

  private async refreshTokens(integration: any): Promise<string> {
    const refreshToken = integration.refreshToken
      ? decryptToken(integration.refreshToken, this.encryptionKey)
      : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    let result;
    const provider = integration.provider.toLowerCase();

    if (provider === 'quickbooks') {
      result = await this.quickbooks.refreshAccessToken(refreshToken);
    } else {
      result = await this.xero.refreshAccessToken(refreshToken);
    }

    const encryptedAccess = encryptToken(
      result.accessToken,
      this.encryptionKey,
    );
    const encryptedRefresh = encryptToken(
      result.refreshToken,
      this.encryptionKey,
    );

    await this.prisma.integration.update({
      where: { id: integration.id },
      data: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + result.expiresIn * 1000),
      },
    });

    return result.accessToken;
  }
}
