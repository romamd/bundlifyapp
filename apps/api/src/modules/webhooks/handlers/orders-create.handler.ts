import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OrdersCreateHandler {
  private readonly logger = new Logger(OrdersCreateHandler.name);

  async handle(shopDomain: string, payload: any) {
    this.logger.log(
      `Order ${payload.id} created for shop ${shopDomain}`,
    );
    // TODO: Track product velocity, update avgDailySales
  }
}
