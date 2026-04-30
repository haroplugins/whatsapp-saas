import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Service } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchAvailabilityDto } from './dto/search-availability.dto';

type BookingSettingsSnapshot = {
  timezone: string;
  minNoticeHours: number;
  maxDaysAhead: number;
};

type OccupiedInterval = {
  start: Date;
  end: Date;
};

type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  occupiedUntil: string;
  label: string;
};

type SearchAvailabilityResult = {
  date: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    bufferMinutes: number;
  };
  settings: BookingSettingsSnapshot;
  slots: AvailabilitySlot[];
  meta: {
    stepMinutes: number;
    weekday: number;
    rulesCount: number;
    appointmentsCount: number;
    blockedSlotsCount: number;
    reason?: 'NO_RULES' | 'OUT_OF_RANGE';
  };
};

const defaultBookingSettings: BookingSettingsSnapshot = {
  timezone: 'Europe/Madrid',
  minNoticeHours: 2,
  maxDaysAhead: 30,
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prismaService: PrismaService) {}

  async search(
    tenantId: string,
    searchAvailabilityDto: SearchAvailabilityDto,
  ): Promise<SearchAvailabilityResult> {
    const stepMinutes = searchAvailabilityDto.stepMinutes ?? 15;
    const selectedDate = parseLocalDate(searchAvailabilityDto.date);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = addMinutes(dayStart, 24 * 60);
    const weekday = selectedDate.getDay();
    const service = await this.getActiveService(
      tenantId,
      searchAvailabilityDto.serviceId,
    );
    const settings = await this.getBookingSettings(tenantId);

    if (!isWithinMaxDaysAhead(selectedDate, settings)) {
      return buildEmptyResult({
        date: searchAvailabilityDto.date,
        service,
        settings,
        stepMinutes,
        weekday,
        reason: 'OUT_OF_RANGE',
      });
    }

    const [availabilityRules, appointments, blockedSlots] = await Promise.all([
      this.prismaService.availabilityRule.findMany({
        where: {
          tenantId,
          weekday,
          isActive: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      }),
      this.prismaService.appointment.findMany({
        where: {
          tenantId,
          status: {
            not: AppointmentStatus.CANCELLED,
          },
          startAt: {
            lt: dayEnd,
          },
          endAt: {
            gt: dayStart,
          },
        },
        include: {
          service: {
            select: {
              bufferMinutes: true,
            },
          },
        },
      }),
      this.prismaService.blockedSlot.findMany({
        where: {
          tenantId,
          startAt: {
            lt: dayEnd,
          },
          endAt: {
            gt: dayStart,
          },
        },
      }),
    ]);

    if (availabilityRules.length === 0) {
      return buildEmptyResult({
        date: searchAvailabilityDto.date,
        service,
        settings,
        stepMinutes,
        weekday,
        reason: 'NO_RULES',
        appointmentsCount: appointments.length,
        blockedSlotsCount: blockedSlots.length,
      });
    }

    const occupiedIntervals: OccupiedInterval[] = [
      ...appointments.map((appointment) => ({
        start: appointment.startAt,
        end: addMinutes(
          appointment.endAt,
          appointment.service?.bufferMinutes ?? 0,
        ),
      })),
      ...blockedSlots.map((blockedSlot) => ({
        start: blockedSlot.startAt,
        end: blockedSlot.endAt,
      })),
    ];
    const earliestAllowedStart = getEarliestAllowedStart(dayStart, settings);
    const slots = availabilityRules.flatMap((rule) =>
      buildCandidateTimesForRule(rule, selectedDate, stepMinutes)
        .filter((candidateStart) => {
          const candidateEnd = addMinutes(
            candidateStart,
            service.durationMinutes,
          );
          const occupiedEndForCheck = addMinutes(
            candidateEnd,
            service.bufferMinutes,
          );
          const ruleEnd = buildDateWithTime(selectedDate, rule.endTime);

          if (occupiedEndForCheck > ruleEnd) {
            return false;
          }

          if (candidateStart < earliestAllowedStart) {
            return false;
          }

          return occupiedIntervals.every(
            (interval) =>
              !intervalsOverlap(
                candidateStart,
                occupiedEndForCheck,
                interval.start,
                interval.end,
              ),
          );
        })
        .map((candidateStart) => {
          const candidateEnd = addMinutes(
            candidateStart,
            service.durationMinutes,
          );
          const occupiedUntil = addMinutes(candidateEnd, service.bufferMinutes);

          return {
            startAt: candidateStart.toISOString(),
            endAt: candidateEnd.toISOString(),
            occupiedUntil: occupiedUntil.toISOString(),
            label: formatShortTime(candidateStart),
          };
        }),
    );

    return {
      date: searchAvailabilityDto.date,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
      },
      settings,
      slots: slots.sort(
        (firstSlot, secondSlot) =>
          new Date(firstSlot.startAt).getTime() -
          new Date(secondSlot.startAt).getTime(),
      ),
      meta: {
        stepMinutes,
        weekday,
        rulesCount: availabilityRules.length,
        appointmentsCount: appointments.length,
        blockedSlotsCount: blockedSlots.length,
      },
    };
  }

  private async getActiveService(
    tenantId: string,
    serviceId: string,
  ): Promise<Service> {
    const service = await this.prismaService.service.findFirst({
      where: {
        id: serviceId,
        tenantId,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    if (!service.isActive) {
      throw new BadRequestException(
        'Service must be active to search availability.',
      );
    }

    return service;
  }

  private async getBookingSettings(
    tenantId: string,
  ): Promise<BookingSettingsSnapshot> {
    const settings = await this.prismaService.bookingSettings.findUnique({
      where: {
        tenantId,
      },
    });

    return {
      timezone: settings?.timezone ?? defaultBookingSettings.timezone,
      minNoticeHours:
        settings?.minNoticeHours ?? defaultBookingSettings.minNoticeHours,
      maxDaysAhead:
        settings?.maxDaysAhead ?? defaultBookingSettings.maxDaysAhead,
    };
  }
}

function buildEmptyResult({
  date,
  service,
  settings,
  stepMinutes,
  weekday,
  reason,
  appointmentsCount = 0,
  blockedSlotsCount = 0,
}: {
  date: string;
  service: Service;
  settings: BookingSettingsSnapshot;
  stepMinutes: number;
  weekday: number;
  reason: 'NO_RULES' | 'OUT_OF_RANGE';
  appointmentsCount?: number;
  blockedSlotsCount?: number;
}): SearchAvailabilityResult {
  return {
    date,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
    },
    settings,
    slots: [],
    meta: {
      stepMinutes,
      weekday,
      rulesCount: 0,
      appointmentsCount,
      blockedSlotsCount,
      reason,
    },
  };
}

function parseLocalDate(value: string): Date {
  const parts = value.split('-').map(Number);
  const yearValue = parts[0];
  const monthValue = parts[1];
  const dayValue = parts[2];

  if (
    yearValue === undefined ||
    monthValue === undefined ||
    dayValue === undefined
  ) {
    throw new BadRequestException('date must be a valid YYYY-MM-DD date.');
  }

  const date = new Date(yearValue, monthValue - 1, dayValue);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== yearValue ||
    date.getMonth() !== monthValue - 1 ||
    date.getDate() !== dayValue
  ) {
    throw new BadRequestException('date must be a valid YYYY-MM-DD date.');
  }

  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function buildCandidateTimesForRule(
  rule: { startTime: string; endTime: string },
  selectedDate: Date,
  stepMinutes: number,
): Date[] {
  const candidates: Date[] = [];
  const ruleStart = buildDateWithTime(selectedDate, rule.startTime);
  const ruleEnd = buildDateWithTime(selectedDate, rule.endTime);

  for (
    let candidate = ruleStart;
    candidate < ruleEnd;
    candidate = addMinutes(candidate, stepMinutes)
  ) {
    candidates.push(candidate);
  }

  return candidates;
}

function buildDateWithTime(date: Date, time: string): Date {
  const [hours = '0', minutes = '0'] = time.split(':');
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number(hours),
    Number(minutes),
  );
}

function getEarliestAllowedStart(
  selectedDateStart: Date,
  settings: BookingSettingsSnapshot,
): Date {
  const minimumNoticeDate = addMinutes(
    new Date(),
    settings.minNoticeHours * 60,
  );

  return minimumNoticeDate > selectedDateStart
    ? minimumNoticeDate
    : selectedDateStart;
}

function isWithinMaxDaysAhead(
  selectedDate: Date,
  settings: BookingSettingsSnapshot,
): boolean {
  const todayStart = startOfDay(new Date());
  const selectedDateStart = startOfDay(selectedDate);
  const maxDate = addMinutes(todayStart, settings.maxDaysAhead * 24 * 60);

  return selectedDateStart <= maxDate;
}

function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

function formatShortTime(value: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
