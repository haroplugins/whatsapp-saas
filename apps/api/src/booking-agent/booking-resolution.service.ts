import { Injectable } from '@nestjs/common';
import { Service as AgendaService } from '@prisma/client';
import { normalizeText } from '../intent-router/intent-router.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BookingResolutionResult,
  DateResolution,
  ServiceResolution,
  ServiceResolutionCandidate,
  TimePreferenceResolution,
} from './booking-resolution.types';

type DateOnly = {
  year: number;
  month: number;
  day: number;
};

const defaultTimezone = 'Europe/Madrid';

const weekdaySources = [
  { source: 'domingo', weekday: 0 },
  { source: 'lunes', weekday: 1 },
  { source: 'martes', weekday: 2 },
  { source: 'miercoles', weekday: 3 },
  { source: 'jueves', weekday: 4 },
  { source: 'viernes', weekday: 5 },
  { source: 'sabado', weekday: 6 },
];

@Injectable()
export class BookingResolutionService {
  constructor(private readonly prismaService: PrismaService) {}

  async resolve(tenantId: string, text: string): Promise<BookingResolutionResult> {
    const normalizedText = normalizeText(text);
    const [services, timezone] = await Promise.all([
      this.getActiveServices(tenantId),
      this.getTenantTimezone(tenantId),
    ]);
    const serviceResolution = this.resolveService(normalizedText, services);
    const dateResolution = this.resolveDate(normalizedText, timezone);
    const timePreference = this.resolveTimePreference(normalizedText);
    const readyForAvailabilitySearch =
      serviceResolution.status === 'MATCHED' &&
      dateResolution.status === 'RESOLVED';

    return {
      input: {
        text,
      },
      serviceResolution,
      dateResolution,
      timePreference,
      missingFields: buildMissingFields(serviceResolution, dateResolution),
      readyForAvailabilitySearch,
      shouldCheckAvailability: false,
      shouldCreateAppointment: false,
      shouldSendMessage: false,
    };
  }

  private getActiveServices(tenantId: string): Promise<AgendaService[]> {
    return this.prismaService.service.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  private async getTenantTimezone(tenantId: string): Promise<string> {
    const settings = await this.prismaService.bookingSettings.findUnique({
      where: {
        tenantId,
      },
      select: {
        timezone: true,
      },
    });

    return settings?.timezone || defaultTimezone;
  }

  private resolveService(
    normalizedText: string,
    services: AgendaService[],
  ): ServiceResolution {
    if (services.length === 0) {
      return {
        status: 'MISSING',
      };
    }

    const candidates = services
      .map((service) => matchService(normalizedText, service))
      .filter((candidate): candidate is ServiceResolutionCandidate =>
        Boolean(candidate),
      );

    if (candidates.length === 0) {
      return {
        status: 'NOT_FOUND',
      };
    }

    if (candidates.length > 1) {
      return {
        status: 'MULTIPLE_MATCHES',
        candidates,
      };
    }

    const candidate = candidates[0];

    if (!candidate) {
      return {
        status: 'NOT_FOUND',
      };
    }

    return {
      status: 'MATCHED',
      ...candidate,
    };
  }

  private resolveDate(
    normalizedText: string,
    timezone: string,
  ): DateResolution {
    const today = getTodayInTimezone(timezone);

    if (hasPhrase(normalizedText, 'hoy')) {
      return {
        status: 'RESOLVED',
        date: formatDateOnly(today),
        source: 'hoy',
        timezone,
      };
    }

    if (hasPhrase(normalizedText, 'pasado manana')) {
      return {
        status: 'RESOLVED',
        date: formatDateOnly(addDays(today, 2)),
        source: 'pasado manana',
        timezone,
      };
    }

    if (hasPhrase(normalizedText, 'manana')) {
      return {
        status: 'RESOLVED',
        date: formatDateOnly(addDays(today, 1)),
        source: 'manana',
        timezone,
      };
    }

    const matchedWeekday = weekdaySources.find((weekday) =>
      hasPhrase(normalizedText, weekday.source),
    );

    if (matchedWeekday) {
      return {
        status: 'RESOLVED',
        date: formatDateOnly(getNextWeekday(today, matchedWeekday.weekday)),
        source: matchedWeekday.source,
        timezone,
      };
    }

    if (containsUnsupportedDateExpression(normalizedText)) {
      return {
        status: 'UNSUPPORTED',
        timezone,
      };
    }

    return {
      status: 'MISSING',
      timezone,
    };
  }

  private resolveTimePreference(
    normalizedText: string,
  ): TimePreferenceResolution {
    if (hasAnyPhrase(normalizedText, ['cualquier hora', 'cuando sea', 'me da igual'])) {
      return {
        status: 'RESOLVED',
        value: 'ANY',
        source: getFirstSource(normalizedText, [
          'cualquier hora',
          'cuando sea',
          'me da igual',
        ]),
      };
    }

    if (hasPhrase(normalizedText, 'por la manana')) {
      return {
        status: 'RESOLVED',
        value: 'MORNING',
        source: 'por la manana',
      };
    }

    if (hasAnyPhrase(normalizedText, ['por la tarde', 'tarde'])) {
      return {
        status: 'RESOLVED',
        value: 'AFTERNOON',
        source: hasPhrase(normalizedText, 'por la tarde') ? 'por la tarde' : 'tarde',
      };
    }

    if (hasAnyPhrase(normalizedText, ['por la noche', 'noche'])) {
      return {
        status: 'RESOLVED',
        value: 'EVENING',
        source: hasPhrase(normalizedText, 'por la noche') ? 'por la noche' : 'noche',
      };
    }

    return {
      status: 'MISSING',
      value: 'UNKNOWN',
    };
  }
}

function matchService(
  normalizedText: string,
  service: AgendaService,
): ServiceResolutionCandidate | null {
  const normalizedName = normalizeText(service.name);

  if (!normalizedName) {
    return null;
  }

  if (hasPhrase(normalizedText, normalizedName)) {
    return {
      serviceId: service.id,
      serviceName: service.name,
      matchedBy: 'name',
      confidence: 'high',
    };
  }

  const matchedToken = normalizedName
    .split(' ')
    .filter((token) => token.length >= 4)
    .find((token) => hasPhrase(normalizedText, token));

  if (matchedToken) {
    return {
      serviceId: service.id,
      serviceName: service.name,
      matchedBy: 'token',
      confidence: 'medium',
    };
  }

  return null;
}

function buildMissingFields(
  serviceResolution: ServiceResolution,
  dateResolution: DateResolution,
): string[] {
  const missingFields = ['customerName'];

  if (serviceResolution.status !== 'MATCHED') {
    missingFields.push('service');
  }

  if (dateResolution.status !== 'RESOLVED') {
    missingFields.push('date');
  }

  return missingFields;
}

function getTodayInTimezone(timezone: string): DateOnly {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

function addDays(date: DateOnly, days: number): DateOnly {
  const utcDate = Date.UTC(date.year, date.month - 1, date.day + days, 12);
  const nextDate = new Date(utcDate);

  return {
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate(),
  };
}

function getNextWeekday(today: DateOnly, targetWeekday: number): DateOnly {
  const todayWeekday = new Date(
    Date.UTC(today.year, today.month - 1, today.day, 12),
  ).getUTCDay();
  const daysUntilTarget = (targetWeekday - todayWeekday + 7) % 7 || 7;

  return addDays(today, daysUntilTarget);
}

function formatDateOnly(date: DateOnly): string {
  return [
    date.year,
    String(date.month).padStart(2, '0'),
    String(date.day).padStart(2, '0'),
  ].join('-');
}

function hasAnyPhrase(normalizedText: string, phrases: string[]): boolean {
  return phrases.some((phrase) => hasPhrase(normalizedText, phrase));
}

function getFirstSource(normalizedText: string, phrases: string[]): string {
  return phrases.find((phrase) => hasPhrase(normalizedText, phrase)) ?? '';
}

function hasPhrase(normalizedText: string, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  const escapedPhrase = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\s)${escapedPhrase}(?=\\s|$)`, 'u');
  return pattern.test(normalizedText);
}

function containsUnsupportedDateExpression(normalizedText: string): boolean {
  return (
    /\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b/u.test(normalizedText) ||
    hasAnyPhrase(normalizedText, ['proxima semana', 'semana que viene'])
  );
}
