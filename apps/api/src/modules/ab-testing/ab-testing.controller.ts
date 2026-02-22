import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ShopifyAuthGuard } from '../../common/guards/shopify-auth.guard';
import { PlanGateGuard } from '../../common/guards/plan-gate.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { ABTestingService } from './ab-testing.service';
import { CreateABTestDto } from './dto/create-ab-test.dto';

@Controller('api/admin/ab-tests')
@UseGuards(ShopifyAuthGuard)
@UseGuards(PlanGateGuard)
@RequiresPlan('GROWTH')
export class ABTestingController {
  constructor(private readonly abTestingService: ABTestingService) {}

  @Get()
  async listTests(@CurrentShop() shop: any) {
    return this.abTestingService.listTests(shop.id);
  }

  @Get(':id')
  async getTest(@CurrentShop() shop: any, @Param('id') id: string) {
    return this.abTestingService.getTest(shop.id, id);
  }

  @Post()
  async createTest(
    @CurrentShop() shop: any,
    @Body() dto: CreateABTestDto,
  ) {
    return this.abTestingService.create(shop.id, dto);
  }

  @Post(':id/start')
  async startTest(@CurrentShop() shop: any, @Param('id') id: string) {
    return this.abTestingService.start(shop.id, id);
  }

  @Post(':id/stop')
  async stopTest(@CurrentShop() shop: any, @Param('id') id: string) {
    return this.abTestingService.stop(shop.id, id);
  }

  @Post(':id/apply')
  async applyWinner(@CurrentShop() shop: any, @Param('id') id: string) {
    await this.abTestingService.applyWinner(shop.id, id);
    return { success: true };
  }
}
