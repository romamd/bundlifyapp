import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { QuickBooksProvider } from './providers/quickbooks.provider';
import { XeroProvider } from './providers/xero.provider';
import { PrismaService } from '@bundlify/prisma-client';
import { MarginModule } from '../margin/margin.module';

@Module({
  imports: [MarginModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    QuickBooksProvider,
    XeroProvider,
    PrismaService,
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
