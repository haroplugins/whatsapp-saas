import { TenantPlan } from '@prisma/client';

export type TenantEntitlementFeatures = {
  canUseAi: boolean;
  canUseAiTone: boolean;
  canUseAiPricing: boolean;
  canUseAiBooking: boolean;
  canUseBasicAutomations: boolean;
  canUsePremiumAutomations: boolean;
  canUseBusinessHours: boolean;
  canUseOffHoursAutomation: boolean;
};

export type TenantEntitlementsResponse = {
  plan: TenantPlan;
  features: TenantEntitlementFeatures;
};
