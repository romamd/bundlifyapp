import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  validateWebhook(rawBody: Buffer, hmacHeader: string): boolean {
    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(rawBody)
      .digest('base64');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(hmacHeader),
        Buffer.from(generatedHmac),
      );
    } catch {
      return false;
    }
  }
}
