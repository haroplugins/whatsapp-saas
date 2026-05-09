import { apiFetch } from './api';

export type BusinessProfileTone = 'friendly' | 'formal';

export type BusinessProfile = {
  businessName: string;
  serviceType: string;
  shortDescription: string;
  publicPhone: string;
  publicEmail: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  twitterX: string;
  addressOrServiceArea: string;
  paymentMethods: string;
  cancellationPolicy: string;
  responseTime: string;
  importantNotes: string;
  tone: BusinessProfileTone;
  baseMessage: string;
};

export type AutomationReplyKind = 'welcome' | 'off_hours';

export const businessProfileStorageKey = 'businessProfile';

export const defaultBusinessProfile: BusinessProfile = {
  businessName: 'Mi negocio',
  serviceType: 'servicio general',
  shortDescription: '',
  publicPhone: '',
  publicEmail: '',
  website: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  youtube: '',
  linkedin: '',
  twitterX: '',
  addressOrServiceArea: '',
  paymentMethods: '',
  cancellationPolicy: '',
  responseTime: '',
  importantNotes: '',
  tone: 'friendly',
  baseMessage: '',
};

export function readStoredBusinessProfile(): BusinessProfile {
  const storedValue = window.localStorage.getItem(businessProfileStorageKey);
  if (!storedValue) return defaultBusinessProfile;
  try {
    return normalizeBusinessProfile(JSON.parse(storedValue) as unknown);
  } catch {
    return defaultBusinessProfile;
  }
}

export function saveStoredBusinessProfile(profile: BusinessProfile): void {
  window.localStorage.setItem(businessProfileStorageKey, JSON.stringify(normalizeBusinessProfile(profile)));
}

export function fetchBusinessProfile(): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>('/business/profile').then(normalizeBusinessProfile);
}

export function saveBusinessProfile(
  profile: BusinessProfile,
): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>('/business/profile', {
    method: 'PATCH',
    body: normalizeBusinessProfile(profile),
  }).then(normalizeBusinessProfile);
}

export function normalizeBusinessProfile(value: unknown): BusinessProfile {
  const candidate = value && typeof value === 'object'
    ? value as Partial<BusinessProfile> & { name?: unknown; service?: unknown }
    : {};
  return {
    businessName: readRequiredText(
      candidate.businessName ?? candidate.name,
      defaultBusinessProfile.businessName,
    ),
    serviceType: readRequiredText(
      candidate.serviceType ?? candidate.service,
      defaultBusinessProfile.serviceType,
    ),
    shortDescription: readOptionalText(candidate.shortDescription),
    publicPhone: readOptionalText(candidate.publicPhone),
    publicEmail: readOptionalText(candidate.publicEmail),
    website: readOptionalText(candidate.website),
    instagram: readOptionalText(candidate.instagram),
    facebook: readOptionalText(candidate.facebook),
    tiktok: readOptionalText(candidate.tiktok),
    youtube: readOptionalText(candidate.youtube),
    linkedin: readOptionalText(candidate.linkedin),
    twitterX: readOptionalText(candidate.twitterX),
    addressOrServiceArea: readOptionalText(candidate.addressOrServiceArea),
    paymentMethods: readOptionalText(candidate.paymentMethods),
    cancellationPolicy: readOptionalText(candidate.cancellationPolicy),
    responseTime: readOptionalText(candidate.responseTime),
    importantNotes: readOptionalText(candidate.importantNotes),
    tone: candidate.tone === 'formal' ? 'formal' : 'friendly',
    baseMessage: readOptionalText(candidate.baseMessage),
  };
}

export function isDefaultBusinessProfile(profile: BusinessProfile): boolean {
  const normalizedProfile = normalizeBusinessProfile(profile);
  return (
    normalizedProfile.businessName === defaultBusinessProfile.businessName &&
    normalizedProfile.serviceType === defaultBusinessProfile.serviceType &&
    normalizedProfile.shortDescription === defaultBusinessProfile.shortDescription &&
    normalizedProfile.publicPhone === defaultBusinessProfile.publicPhone &&
    normalizedProfile.publicEmail === defaultBusinessProfile.publicEmail &&
    normalizedProfile.website === defaultBusinessProfile.website &&
    normalizedProfile.instagram === defaultBusinessProfile.instagram &&
    normalizedProfile.facebook === defaultBusinessProfile.facebook &&
    normalizedProfile.tiktok === defaultBusinessProfile.tiktok &&
    normalizedProfile.youtube === defaultBusinessProfile.youtube &&
    normalizedProfile.linkedin === defaultBusinessProfile.linkedin &&
    normalizedProfile.twitterX === defaultBusinessProfile.twitterX &&
    normalizedProfile.addressOrServiceArea === defaultBusinessProfile.addressOrServiceArea &&
    normalizedProfile.paymentMethods === defaultBusinessProfile.paymentMethods &&
    normalizedProfile.cancellationPolicy === defaultBusinessProfile.cancellationPolicy &&
    normalizedProfile.responseTime === defaultBusinessProfile.responseTime &&
    normalizedProfile.importantNotes === defaultBusinessProfile.importantNotes &&
    normalizedProfile.tone === defaultBusinessProfile.tone &&
    normalizedProfile.baseMessage === defaultBusinessProfile.baseMessage
  );
}

export function buildBusinessAutomationReply(kind: AutomationReplyKind, automationMessage: string, profile: BusinessProfile): string {
  const normalizedProfile = normalizeBusinessProfile(profile);
  const intro = getIntro(kind, normalizedProfile);
  const baseMessage = normalizedProfile.baseMessage.trim();
  const messageParts = [intro, automationMessage.trim(), baseMessage].filter(Boolean);
  return messageParts.join(' ');
}

function getIntro(kind: AutomationReplyKind, profile: BusinessProfile): string {
  if (profile.tone === 'formal') {
    return kind === 'off_hours'
      ? `Hola, le atiende ${profile.businessName}. Hemos recibido su consulta sobre ${profile.serviceType}.`
      : `Hola, le atiende ${profile.businessName}. Gracias por contactar por ${profile.serviceType}.`;
  }
  return kind === 'off_hours'
    ? `Hola, soy ${profile.businessName}. Hemos recibido tu mensaje sobre ${profile.serviceType}.`
    : `Hola, soy ${profile.businessName}. Gracias por escribir sobre ${profile.serviceType}.`;
}

function readRequiredText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function readOptionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
