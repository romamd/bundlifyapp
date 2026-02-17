import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CurrencyService } from '../modules/currency/currency.service';

@Processor('exchange-rate-sync')
export class ExchangeRateSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ExchangeRateSyncProcessor.name);

  constructor(private readonly currencyService: CurrencyService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Starting exchange rate sync');
    const count = await this.currencyService.syncRates();
    this.logger.log(`Exchange rate sync completed: ${count} rates updated`);
  }
}
