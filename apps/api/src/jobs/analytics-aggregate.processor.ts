import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('analytics-aggregate')
export class AnalyticsAggregateProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsAggregateProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log('Analytics aggregation not yet implemented');
  }
}
