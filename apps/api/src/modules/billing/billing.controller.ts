import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { BillingService } from './billing.service';
import type { Shop } from '@bundlify/prisma-client';

@Controller('api/admin/billing')
@UseGuards(ShopifyAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('upgrade')
  async upgrade(
    @CurrentShop() shop: Shop,
    @Body('plan') plan: string,
  ) {
    if (plan !== 'STARTER' && plan !== 'GROWTH') {
      throw new BadRequestException(
        'Invalid plan. Must be STARTER or GROWTH.',
      );
    }

    const confirmationUrl = await this.billingService.createCharge(
      shop.id,
      plan,
    );

    return { confirmationUrl };
  }

  @Get('confirm')
  async confirm(
    @CurrentShop() shop: Shop,
    @Query('charge_id') chargeId: string,
  ) {
    if (!chargeId) {
      throw new BadRequestException('charge_id is required');
    }

    await this.billingService.confirmCharge(shop.id, chargeId);

    return { success: true, plan: shop.plan };
  }
}
