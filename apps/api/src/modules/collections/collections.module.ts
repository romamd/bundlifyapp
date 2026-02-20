import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '@bundlify/prisma-client';

@Module({
  imports: [AuthModule],
  controllers: [CollectionsController],
  providers: [CollectionsService, PrismaService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
