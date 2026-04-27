export type AIConfigMode = 'suggestions' | 'auto_reply' | 'autopilot';
export type AIConfigTone = 'friendly' | 'professional' | 'direct' | 'formal';
export type AIConfigFallback = 'ask_more' | 'mark_pending' | 'notify';

export type AIConfig = {
  mode: AIConfigMode;
  permissions: {
    faq: boolean;
    pricing: boolean;
    booking: boolean;
    complaints: boolean;
    cancellations: boolean;
  };
  tone: AIConfigTone;
  customStyle: string;
  fallback: AIConfigFallback;
  useOutsideHours: boolean;
};

export const aiConfigStorageKey = 'aiConfig';

export const defaultAIConfig: AIConfig = {
  mode: 'suggestions',
  permissions: {
    faq: true,
    pricing: true,
    booking: false,
    complaints: false,
    cancellations: false,
  },
  tone: 'friendly',
  customStyle: '',
  fallback: 'mark_pending',
  useOutsideHours: true,
};

export function readStoredAIConfig(): AIConfig {
  const storedValue = window.localStorage.getItem(aiConfigStorageKey);
  if (!storedValue) return defaultAIConfig;
  try {
    return normalizeAIConfig(JSON.parse(storedValue) as unknown);
  } catch {
    return defaultAIConfig;
  }
}

export function saveStoredAIConfig(config: AIConfig): void {
  window.localStorage.setItem(aiConfigStorageKey, JSON.stringify(normalizeAIConfig(config)));
}

export function normalizeAIConfig(value: unknown): AIConfig {
  const candidate = value && typeof value === 'object' ? value as Partial<AIConfig> : {};
  const permissions = candidate.permissions && typeof candidate.permissions === 'object'
    ? candidate.permissions as Partial<AIConfig['permissions']>
    : {};
  return {
    mode: readMode(candidate.mode),
    permissions: {
      faq: readBoolean(permissions.faq, defaultAIConfig.permissions.faq),
      pricing: readBoolean(permissions.pricing, defaultAIConfig.permissions.pricing),
      booking: readBoolean(permissions.booking, defaultAIConfig.permissions.booking),
      complaints: readBoolean(permissions.complaints, defaultAIConfig.permissions.complaints),
      cancellations: readBoolean(permissions.cancellations, defaultAIConfig.permissions.cancellations),
    },
    tone: readTone(candidate.tone),
    customStyle: typeof candidate.customStyle === 'string' ? candidate.customStyle.trim() : defaultAIConfig.customStyle,
    fallback: readFallback(candidate.fallback),
    useOutsideHours: readBoolean(candidate.useOutsideHours, defaultAIConfig.useOutsideHours),
  };
}

function readMode(value: unknown): AIConfigMode {
  if (value === 'auto_reply' || value === 'autopilot') return value;
  return 'suggestions';
}

function readTone(value: unknown): AIConfigTone {
  if (value === 'professional' || value === 'direct' || value === 'formal') return value;
  return 'friendly';
}

function readFallback(value: unknown): AIConfigFallback {
  if (value === 'ask_more' || value === 'notify') return value;
  return 'mark_pending';
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
