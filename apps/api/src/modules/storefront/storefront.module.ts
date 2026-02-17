import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  controllers: [StorefrontController],
  providers: [StorefrontService, PrismaService],
})
export class StorefrontModule {}
