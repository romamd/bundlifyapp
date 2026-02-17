import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { PrismaService } from '@bundlify/prisma-client';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FlowController],
  providers: [FlowService, PrismaService],
  exports: [FlowService],
})
export class FlowModule {}
