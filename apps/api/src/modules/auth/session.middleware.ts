import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from '@bundlify/prisma-client';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SessionMiddleware.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Dev-mode bypass: auto-attach first shop when no token
        if (process.env.NODE_ENV !== 'production') {
          const devShop = await this.prisma.shop.findFirst();
          if (devShop) (req as any).shop = devShop;
        }
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
