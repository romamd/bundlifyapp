import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  providers: [CurrencyService, PrismaService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
