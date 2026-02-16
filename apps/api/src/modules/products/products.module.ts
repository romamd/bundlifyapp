import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsSyncService } from './products-sync.service';
import { MarginModule } from '../margin/margin.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  imports: [MarginModule, AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsSyncService, PrismaService],
  exports: [ProductsService, ProductsSyncService],
})
export class ProductsModule {}
