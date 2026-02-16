import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ProductsUpdateHandler } from './handlers/products-update.handler';
import { OrdersCreateHandler } from './handlers/orders-create.handler';
import { OrdersPaidHandler } from './handlers/orders-paid.handler';
import { AppUninstalledHandler } from './handlers/app-uninstalled.handler';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    ProductsUpdateHandler,
    OrdersCreateHandler,
    OrdersPaidHandler,
    AppUninstalledHandler,
    PrismaService,
  ],
})
export class WebhooksModule {}
