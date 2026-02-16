import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from '../modules/auth/auth.module';
import { WebhooksModule } from '../modules/webhooks/webhooks.module';
import { ProductsModule } from '../modules/products/products.module';
import { MarginModule } from '../modules/margin/margin.module';
import { SessionMiddleware } from '../modules/auth/session.middleware';
import { ShopifyErrorFilter } from '../common/filters/shopify-error.filter';

@Module({
  imports: [AuthModule, WebhooksModule, ProductsModule, MarginModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ShopifyErrorFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('api/admin/*');
  }
}
