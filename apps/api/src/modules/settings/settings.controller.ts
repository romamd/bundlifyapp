import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import type { Shop } from '@bundlify/prisma-client';

@Controller('api/admin/settings')
@UseGuards(ShopifyAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentShop() shop: Shop) {
    return this.settingsService.getSettings(shop.id);
  }

  @Put()
  async updateSettings(
    @CurrentShop() shop: Shop,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(shop.id, dto);
  }
}
