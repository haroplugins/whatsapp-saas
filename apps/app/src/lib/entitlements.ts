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
  canUseAgenda: boolean;
  canUseManualAgenda: boolean;
  canUseSmartBooking: boolean;
  canUseAutoBookingConfirm: boolean;
  canUseCalendarIntegration: boolean;
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
    canUseAgenda: false,
    canUseManualAgenda: false,
    canUseSmartBooking: false,
    canUseAutoBookingConfirm: false,
    canUseCalendarIntegration: false,
  },
};

export async function fetchTenantEntitlements(): Promise<TenantEntitlements> {
  return apiFetch<TenantEntitlements>('/tenant/entitlements');
}

export function getTenantPlanDescription(plan: TenantPlan): string {
  if (plan === 'BASIC') {
    return 'Incluye bandeja básica. Agenda e IA avanzada requieren un plan superior.';
  }
  if (plan === 'PRO') {
    return 'Incluye Agenda manual y gestión avanzada del negocio.';
  }
  return 'Incluye Agenda inteligente y funciones avanzadas de automatización.';
}

export function getTenantPlanBadgeClass(plan: TenantPlan): string {
  if (plan === 'PREMIUM') return 'plan-badge plan-badge--premium';
  if (plan === 'PRO') return 'plan-badge plan-badge--pro';
  return 'plan-badge plan-badge--basic';
}
