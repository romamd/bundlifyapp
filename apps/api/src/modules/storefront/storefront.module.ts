import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { PrismaService } from '@bundlify/prisma-client';
import { ABTestingModule } from '../ab-testing/ab-testing.module';

@Module({
  imports: [ABTestingModule],
  controllers: [StorefrontController],
  providers: [StorefrontService, PrismaService],
})
export class StorefrontModule {}
