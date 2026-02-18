import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';
import { encryptToken, decryptToken } from '../../common/utils/crypto.util';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly encryptionKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.encryptionKey = process.env.TOKEN_ENCRYPTION_KEY!;
  }

  async beginAuth(shop: string, redirectPath: string): Promise<string> {
    const callbackUrl =
      process.env.SHOPIFY_AUTH_CALLBACK_URL ||
      `${process.env.APP_URL}/auth/callback`;

    return `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
  }

  async handleCallback(query: Record<string, string>) {
    const { shop, code, hmac } = query;

    // Validate HMAC
    if (!this.validateHmac(query)) {
      throw new UnauthorizedException('Invalid HMAC');
    }

    // Exchange code for access token
    const tokenResponse = await this.exchangeCodeForToken(shop, code);
    const accessToken = tokenResponse.access_token;

    // Encrypt and store
    const encryptedToken = encryptToken(accessToken, this.encryptionKey);

    const existingShop = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shop },
    });

    const savedShop = await this.prisma.shop.upsert({
      where: { shopifyDomain: shop },
      update: {
        accessToken: encryptedToken,
        uninstalledAt: null,
      },
      create: {
        shopifyDomain: shop,
        accessToken: encryptedToken,
        installedAt: new Date(),
      },
    });

    // Create default settings if new install
    if (!existingShop) {
      await this.prisma.shopSettings.create({
        data: { shopId: savedShop.id },
      });
    }

    this.logger.log(`Shop ${shop} authenticated successfully`);
    return savedShop;
  }

  async validateSessionToken(token: string) {
    const payload = this.decodeSessionToken(token);
    const shop = payload.dest.replace('https://', '');

    let shopRecord = await this.prisma.shop.findUnique({
      where: { shopifyDomain: shop },
    });

    // If shop doesn't exist, use token exchange to get an access token
    // and auto-create the shop record (managed installation flow)
    if (!shopRecord || shopRecord.uninstalledAt) {
      this.logger.log(`Shop ${shop} not found, attempting token exchange`);
      try {
        shopRecord = await this.exchangeSessionForOfflineToken(shop, token);
      } catch (err) {
        this.logger.error(`Token exchange failed for ${shop}`, err);
        throw new UnauthorizedException('Shop not found and token exchange failed');
      }
    }

    return shopRecord;
  }

  private async exchangeSessionForOfflineToken(shop: string, sessionToken: string) {
    const response: globalThis.Response = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token: sessionToken,
          subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
          requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
        }),
      },
    );

    if (!response.ok) {
      const body: any = await response.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(body)}`);
    }

    const data: any = await response.json();
    const accessToken = data.access_token;

    const encryptedToken = encryptToken(accessToken, this.encryptionKey);

    const savedShop = await this.prisma.shop.upsert({
      where: { shopifyDomain: shop },
      update: {
        accessToken: encryptedToken,
        uninstalledAt: null,
      },
      create: {
        shopifyDomain: shop,
        accessToken: encryptedToken,
        installedAt: new Date(),
      },
    });

    // Create default settings if new
    const existingSettings = await this.prisma.shopSettings.findUnique({
      where: { shopId: savedShop.id },
    });
    if (!existingSettings) {
      await this.prisma.shopSettings.create({
        data: { shopId: savedShop.id },
      });
    }

    this.logger.log(`Shop ${shop} auto-registered via token exchange`);
    return savedShop;
  }

  async getDecryptedAccessToken(shopId: string): Promise<string> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });
    return decryptToken(shop.accessToken, this.encryptionKey);
  }

  private validateHmac(query: Record<string, string>): boolean {
    const { hmac, ...params } = query;
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(sortedParams)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(generatedHmac),
    );
  }

  private async exchangeCodeForToken(
    shop: string,
    code: string,
  ): Promise<{ access_token: string }> {
    const response = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  private decodeSessionToken(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    );

    // Verify issuer is a Shopify domain
    if (
      !payload.iss ||
      !payload.iss.includes('myshopify.com')
    ) {
      throw new Error('Invalid token issuer');
    }

    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  }
}
