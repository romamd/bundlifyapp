import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  imports: [AuthModule],
  controllers: [BillingController],
  providers: [BillingService, PrismaService],
})
export class BillingModule {}
