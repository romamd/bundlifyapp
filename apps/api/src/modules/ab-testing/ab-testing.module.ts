import { Module } from '@nestjs/common';
import { ABTestingController } from './ab-testing.controller';
import { ABTestingService } from './ab-testing.service';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  controllers: [ABTestingController],
  providers: [ABTestingService, PrismaService],
  exports: [ABTestingService],
})
export class ABTestingModule {}
