import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get()
  async auth(@Query('shop') shop: string, @Res() res: Response) {
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const redirectUrl = await this.authService.beginAuth(shop, '/auth/callback');
    return res.redirect(redirectUrl);
  }

  @Get('callback')
  async callback(@Query() query: Record<string, string>, @Res() res: Response) {
    try {
      await this.authService.handleCallback(query);

      // Redirect to the embedded admin app
      const shop = query.shop;
      const apiKey = process.env.SHOPIFY_API_KEY;
      return res.redirect(
        `https://${shop}/admin/apps/${apiKey}`,
      );
    } catch (error) {
      this.logger.error('Auth callback failed', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }
}
