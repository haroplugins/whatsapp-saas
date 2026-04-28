import { apiFetch } from './api';

export type TenantPlan = 'BASIC' | 'PRO' | 'PREMIUM';

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

export type TenantEntitlements = {
  plan: TenantPlan;
  features: TenantEntitlementFeatures;
};

export const defaultTenantEntitlements: TenantEntitlements = {
  plan: 'BASIC',
  features: {
    canUseAi: false,
    canUseAiTone: false,
    canUseAiPricing: false,
    canUseAiBooking: false,
    canUseBasicAutomations: true,
    canUsePremiumAutomations: false,
    canUseBusinessHours: true,
    canUseOffHoursAutomation: true,
  },
};

export async function fetchTenantEntitlements(): Promise<TenantEntitlements> {
  return apiFetch<TenantEntitlements>('/tenant/entitlements');
}
