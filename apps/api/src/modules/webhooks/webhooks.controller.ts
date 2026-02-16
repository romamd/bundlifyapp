import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { ProductsUpdateHandler } from './handlers/products-update.handler';
import { OrdersCreateHandler } from './handlers/orders-create.handler';
import { OrdersPaidHandler } from './handlers/orders-paid.handler';
import { AppUninstalledHandler } from './handlers/app-uninstalled.handler';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly productsUpdateHandler: ProductsUpdateHandler,
    private readonly ordersCreateHandler: OrdersCreateHandler,
    private readonly ordersPaidHandler: OrdersPaidHandler,
    private readonly appUninstalledHandler: AppUninstalledHandler,
  ) {}

  @Post('products-update')
  async productsUpdate(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.handleWebhook(req, res, hmac, shopDomain, (body) =>
      this.productsUpdateHandler.handle(shopDomain, body),
    );
  }

  @Post('products-create')
  async productsCreate(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.handleWebhook(req, res, hmac, shopDomain, (body) =>
      this.productsUpdateHandler.handle(shopDomain, body),
    );
  }

  @Post('products-delete')
  async productsDelete(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.handleWebhook(req, res, hmac, shopDomain, async (body) => {
      this.logger.log(`Product ${body.id} deleted for ${shopDomain}`);
      // Soft-handle: products are kept for historical data
    });
  }

  @Post('orders-create')
  async ordersCreate(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.handleWebhook(req, res, hmac, shopDomain, (body) =>
      this.ordersCreateHandler.handle(shopDomain, body),
    );
  }

  @Post('orders-paid')
  async ordersPaid(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.handleWebhook(req, res, hmac, shopDomain, (body) =>
      this.ordersPaidHandler.handle(shopDomain, body),
    );
  }

  @Post('app-uninstalled')
  async appUninstalled(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.handleWebhook(req, res, hmac, shopDomain, () =>
      this.appUninstalledHandler.handle(shopDomain),
    );
  }

  private async handleWebhook(
    req: Request,
    res: Response,
    hmac: string,
    shopDomain: string,
    handler: (body: any) => Promise<void>,
  ) {
    const rawBody = (req as any).rawBody as Buffer;

    if (!rawBody || !hmac) {
      return res.status(HttpStatus.UNAUTHORIZED).send('Missing HMAC');
    }

    if (!this.webhooksService.validateWebhook(rawBody, hmac)) {
      return res.status(HttpStatus.UNAUTHORIZED).send('Invalid HMAC');
    }

    // Respond immediately, process async
    res.status(HttpStatus.OK).send('OK');

    try {
      const body = JSON.parse(rawBody.toString('utf8'));
      await handler(body);
    } catch (error) {
      this.logger.error(
        `Webhook handler failed for ${shopDomain}`,
        error,
      );
    }
  }
}
