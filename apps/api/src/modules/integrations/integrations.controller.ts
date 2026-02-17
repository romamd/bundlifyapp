import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { PlanGateGuard } from '../../common/guards/plan-gate.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { IntegrationsService } from './integrations.service';

@Controller('api/admin/integrations')
@RequiresPlan('GROWTH')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @UseGuards(ShopifyAuthGuard)
  @UseGuards(PlanGateGuard)
  async listIntegrations(@CurrentShop() shop: any) {
    return this.integrationsService.listIntegrations(shop.id);
  }

  @Post(':provider/connect')
  @UseGuards(ShopifyAuthGuard)
  @UseGuards(PlanGateGuard)
  async connect(
    @CurrentShop() shop: any,
    @Param('provider') provider: string,
  ) {
    const url = this.integrationsService.getConnectUrl(shop.id, provider);
    return { url };
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.integrationsService.handleCallback(provider, code, state);
    // Redirect back to admin integrations page
    res.redirect(`${process.env.APP_URL}/integrations?connected=${provider}`);
  }

  @Post(':provider/sync')
  @UseGuards(ShopifyAuthGuard)
  @UseGuards(PlanGateGuard)
  async sync(
    @CurrentShop() shop: any,
    @Param('provider') provider: string,
  ) {
    return this.integrationsService.syncCogs(shop.id, provider);
  }

  @Delete(':provider')
  @UseGuards(ShopifyAuthGuard)
  @UseGuards(PlanGateGuard)
  async disconnect(
    @CurrentShop() shop: any,
    @Param('provider') provider: string,
  ) {
    await this.integrationsService.disconnect(shop.id, provider);
    return { success: true };
  }
}
