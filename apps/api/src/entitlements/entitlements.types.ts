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
  canUseAgenda: boolean;
  canUseManualAgenda: boolean;
  canUseSmartBooking: boolean;
  canUseAutoBookingConfirm: boolean;
  canUseCalendarIntegration: boolean;
};

export type TenantEntitlementsResponse = {
  plan: TenantPlan;
  features: TenantEntitlementFeatures;
};
