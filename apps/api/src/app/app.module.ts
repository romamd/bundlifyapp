import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from '../modules/auth/auth.module';
import { WebhooksModule } from '../modules/webhooks/webhooks.module';
import { ProductsModule } from '../modules/products/products.module';
import { MarginModule } from '../modules/margin/margin.module';
import { BundlesModule } from '../modules/bundles/bundles.module';
import { StorefrontModule } from '../modules/storefront/storefront.module';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { BillingModule } from '../modules/billing/billing.module';
import { FlowModule } from '../modules/flow/flow.module';
import { ABTestingModule } from '../modules/ab-testing/ab-testing.module';
import { CurrencyModule } from '../modules/currency/currency.module';
import { IntegrationsModule } from '../modules/integrations/integrations.module';
import { AffinityModule } from '../modules/affinity/affinity.module';
import { JobsModule } from '../jobs/jobs.module';
import { SessionMiddleware } from '../modules/auth/session.middleware';
import { ShopifyErrorFilter } from '../common/filters/shopify-error.filter';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'admin'),
      exclude: ['/api/(.*)', '/auth/(.*)', '/webhooks/(.*)'],
    }),
    AuthModule,
    WebhooksModule,
    ProductsModule,
    MarginModule,
    BundlesModule,
    StorefrontModule,
    AnalyticsModule,
    SettingsModule,
    BillingModule,
    FlowModule,
    ABTestingModule,
    CurrencyModule,
    IntegrationsModule,
    AffinityModule,
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
