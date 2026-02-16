import { Module } from '@nestjs/common';
import { MarginService } from './margin.service';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  providers: [MarginService, PrismaService],
  exports: [MarginService],
})
export class MarginModule {}
