export type BusinessProfileTone = 'friendly' | 'formal';

export type BusinessProfile = {
  name: string;
  service: string;
  tone: BusinessProfileTone;
  baseMessage: string;
};

export type AutomationReplyKind = 'welcome' | 'off_hours';

export const businessProfileStorageKey = 'businessProfile';

export const defaultBusinessProfile: BusinessProfile = {
  name: 'Mi negocio',
  service: 'servicio general',
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

export function normalizeBusinessProfile(value: unknown): BusinessProfile {
  const candidate = value && typeof value === 'object' ? value as Partial<BusinessProfile> : {};
  return {
    name: readRequiredText(candidate.name, defaultBusinessProfile.name),
    service: readRequiredText(candidate.service, defaultBusinessProfile.service),
    tone: candidate.tone === 'formal' ? 'formal' : 'friendly',
    baseMessage: readOptionalText(candidate.baseMessage),
  };
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
      ? `Hola, le atiende ${profile.name}. Hemos recibido su consulta sobre ${profile.service}.`
      : `Hola, le atiende ${profile.name}. Gracias por contactar por ${profile.service}.`;
  }
  return kind === 'off_hours'
    ? `Hola, soy ${profile.name}. Hemos recibido tu mensaje sobre ${profile.service}.`
    : `Hola, soy ${profile.name}. Gracias por escribir sobre ${profile.service}.`;
}

function readRequiredText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function readOptionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
