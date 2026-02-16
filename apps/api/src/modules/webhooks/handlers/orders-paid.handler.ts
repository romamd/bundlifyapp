import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OrdersPaidHandler {
  private readonly logger = new Logger(OrdersPaidHandler.name);

  async handle(shopDomain: string, payload: any) {
    this.logger.log(
      `Order ${payload.id} paid for shop ${shopDomain}`,
    );
    // TODO: Track bundle redemptions, update lastSoldAt
  }
}
