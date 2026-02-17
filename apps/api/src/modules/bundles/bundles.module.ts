import { Module } from '@nestjs/common';
import { BundlesController } from './bundles.controller';
import { BundlesService } from './bundles.service';
import { BundleEngineService } from './bundle-engine.service';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  imports: [],
  controllers: [BundlesController],
  providers: [BundlesService, BundleEngineService, PrismaService],
  exports: [BundlesService, BundleEngineService],
})
export class BundlesModule {}
