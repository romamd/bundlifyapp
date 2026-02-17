import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PlanGateGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan =
      this.reflector.get<string>('requiredPlan', context.getHandler()) ||
      this.reflector.get<string>('requiredPlan', context.getClass());

    if (!requiredPlan) return true;

    const request = context.switchToHttp().getRequest();
    const shop = request.shop;
    if (!shop) return true;

    const planHierarchy: Record<string, number> = {
      FREE: 0,
      STARTER: 1,
      GROWTH: 2,
    };

    const shopPlanLevel = planHierarchy[shop.plan] ?? 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] ?? 0;

    if (shopPlanLevel < requiredPlanLevel) {
      throw new ForbiddenException({
        message: `This feature requires the ${requiredPlan} plan or higher`,
        requiredPlan,
        currentPlan: shop.plan,
        upgradeUrl: '/api/admin/billing/subscribe',
      });
    }

    return true;
  }
}
