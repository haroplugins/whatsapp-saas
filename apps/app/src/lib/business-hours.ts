export type BusinessHours = {
  timezone: string;
  days: number[];
  start: string;
  end: string;
};

export const businessHoursStorageKey = 'businessHours';

export const defaultBusinessHours: BusinessHours = {
  timezone: 'Europe/Madrid',
  days: [1, 2, 3, 4, 5],
  start: '09:00',
  end: '18:00',
};

export function readStoredBusinessHours(): BusinessHours {
  const storedValue = window.localStorage.getItem(businessHoursStorageKey);
  if (!storedValue) return defaultBusinessHours;
  try {
    return normalizeBusinessHours(JSON.parse(storedValue) as unknown);
  } catch {
    return defaultBusinessHours;
  }
}

export function saveStoredBusinessHours(config: BusinessHours): void {
  window.localStorage.setItem(businessHoursStorageKey, JSON.stringify(normalizeBusinessHours(config)));
}

export function normalizeBusinessHours(value: unknown): BusinessHours {
  const candidate = value && typeof value === 'object' ? value as Partial<BusinessHours> : {};
  const days = Array.isArray(candidate.days)
    ? candidate.days.filter(isValidDay).sort((firstDay, secondDay) => firstDay - secondDay)
    : defaultBusinessHours.days;
  const start = typeof candidate.start === 'string' && isValidTimeString(candidate.start) ? candidate.start : defaultBusinessHours.start;
  const end = typeof candidate.end === 'string' && isValidTimeString(candidate.end) ? candidate.end : defaultBusinessHours.end;
  const timezone = typeof candidate.timezone === 'string' && candidate.timezone.trim() ? candidate.timezone.trim() : defaultBusinessHours.timezone;
  return {
    timezone,
    days,
    start,
    end,
  };
}

export function isOutsideBusinessHours(config: BusinessHours, now = new Date()): boolean {
  const normalizedConfig = normalizeBusinessHours(config);
  const businessDate = getDateInTimeZone(now, normalizedConfig.timezone);
  const currentDay = businessDate.getDay();
  const currentTime = `${businessDate.getHours().toString().padStart(2, '0')}:${businessDate.getMinutes().toString().padStart(2, '0')}`;
  if (!normalizedConfig.days.includes(currentDay)) return true;
  return currentTime < normalizedConfig.start || currentTime > normalizedConfig.end;
}

export function isValidDay(day: unknown): day is number {
  return typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6;
}

export function isValidTimeString(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function getDateInTimeZone(date: Date, timezone: string): Date {
  try {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  } catch {
    return new Date(date.toLocaleString('en-US', { timeZone: defaultBusinessHours.timezone }));
  }
}
