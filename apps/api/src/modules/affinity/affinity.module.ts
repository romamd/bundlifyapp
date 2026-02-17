import { Module } from '@nestjs/common';
import { AffinityService } from './affinity.service';
import { PrismaService } from '@bundlify/prisma-client';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AffinityService, PrismaService],
  exports: [AffinityService],
})
export class AffinityModule {}
