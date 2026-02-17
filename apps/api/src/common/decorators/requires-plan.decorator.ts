import { SetMetadata } from '@nestjs/common';

export const RequiresPlan = (plan: string) => SetMetadata('requiredPlan', plan);
