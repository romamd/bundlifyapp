import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ShopifyErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ShopifyErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    // Handle Shopify API rate limit errors
    if (this.isShopifyRateLimitError(exception)) {
      const retryAfter =
        (exception as any).response?.headers?.['retry-after'] ?? '2';
      response
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .header('Retry-After', retryAfter)
        .json({ message: 'Shopify API rate limit exceeded', retryAfter });
      return;
    }

    this.logger.error('Unhandled exception', exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal server error' });
  }

  private isShopifyRateLimitError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message?.includes('429') ||
        error.message?.includes('Throttled'))
    );
  }
}
