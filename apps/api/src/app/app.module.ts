import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from '../modules/auth/auth.module';
import { WebhooksModule } from '../modules/webhooks/webhooks.module';
import { ProductsModule } from '../modules/products/products.module';
import { MarginModule } from '../modules/margin/margin.module';
import { BundlesModule } from '../modules/bundles/bundles.module';
import { StorefrontModule } from '../modules/storefront/storefront.module';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { BillingModule } from '../modules/billing/billing.module';
import { JobsModule } from '../jobs/jobs.module';
import { SessionMiddleware } from '../modules/auth/session.middleware';
import { ShopifyErrorFilter } from '../common/filters/shopify-error.filter';

@Module({
  imports: [
    AuthModule,
    WebhooksModule,
    ProductsModule,
    MarginModule,
    BundlesModule,
    StorefrontModule,
    AnalyticsModule,
    SettingsModule,
    BillingModule,
    JobsModule,
  ],
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
