import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('api/flow')
export class FlowController {
  private readonly logger = new Logger(FlowController.name);

  constructor(private readonly flowService: FlowService) {}

  @Post('actions/activate-bundle')
  async activateBundle(
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Body() body: { bundle_id: string },
  ) {
    await this.flowService.activateBundle(shopDomain, body.bundle_id);
    return { success: true };
  }

  @Post('actions/pause-bundle')
  async pauseBundle(
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Body() body: { bundle_id: string },
  ) {
    await this.flowService.pauseBundle(shopDomain, body.bundle_id);
    return { success: true };
  }

  @Post('actions/generate-bundles')
  async generateBundles(
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    await this.flowService.generateBundles(shopDomain);
    return { success: true };
  }
}
