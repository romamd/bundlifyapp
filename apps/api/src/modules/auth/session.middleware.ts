import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SessionMiddleware.name);

  constructor(private readonly authService: AuthService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.replace('Bearer ', '');
      const shop = await this.authService.validateSessionToken(token);
      (req as any).shop = shop;
    } catch (error) {
      this.logger.debug('Session validation failed', error);
    }

    next();
  }
}
