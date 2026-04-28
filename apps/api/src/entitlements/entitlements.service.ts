import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  type TenantEntitlementFeatures,
  type TenantEntitlementsResponse,
} from './entitlements.types';

const entitlementsByPlan: Record<TenantPlan, TenantEntitlementFeatures> = {
  BASIC: {
    canUseAi: false,
    canUseAiTone: false,
    canUseAiPricing: false,
    canUseAiBooking: false,
    canUseBasicAutomations: true,
    canUsePremiumAutomations: false,
    canUseBusinessHours: true,
    canUseOffHoursAutomation: true,
  },
  PRO: {
    canUseAi: true,
    canUseAiTone: true,
    canUseAiPricing: true,
    canUseAiBooking: true,
    canUseBasicAutomations: true,
    canUsePremiumAutomations: false,
    canUseBusinessHours: true,
    canUseOffHoursAutomation: true,
  },
  PREMIUM: {
    canUseAi: true,
    canUseAiTone: true,
    canUseAiPricing: true,
    canUseAiBooking: true,
    canUseBasicAutomations: true,
    canUsePremiumAutomations: true,
    canUseBusinessHours: true,
    canUseOffHoursAutomation: true,
  },
};

@Injectable()
export class EntitlementsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTenantEntitlements(tenantId: string): Promise<TenantEntitlementsResponse> {
    const tenant = await this.prismaService.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        plan: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    return this.getEntitlementsForPlan(tenant.plan);
  }

  getEntitlementsForPlan(plan: TenantPlan): TenantEntitlementsResponse {
    return {
      plan,
      features: entitlementsByPlan[plan],
    };
  }
}
