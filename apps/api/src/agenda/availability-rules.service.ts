import { BadRequestException, Injectable } from '@nestjs/common';
import { AvailabilityRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AvailabilityRuleInputDto,
  UpdateAvailabilityRulesDto,
} from './dto/update-availability-rules.dto';

@Injectable()
export class AvailabilityRulesService {
  constructor(private readonly prismaService: PrismaService) {}

  listByTenant(tenantId: string): Promise<AvailabilityRule[]> {
    return this.prismaService.availabilityRule.findMany({
      where: {
        tenantId,
      },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  async replaceForTenant(
    tenantId: string,
    updateAvailabilityRulesDto: UpdateAvailabilityRulesDto,
  ): Promise<AvailabilityRule[]> {
    const rules = normalizeRules(updateAvailabilityRulesDto.rules);
    validateNoOverlaps(rules);

    await this.prismaService.$transaction(async (transaction) => {
      await transaction.availabilityRule.deleteMany({
        where: {
          tenantId,
        },
      });

      if (rules.length > 0) {
        await transaction.availabilityRule.createMany({
          data: rules.map((rule) => ({
            tenantId,
            weekday: rule.weekday,
            startTime: rule.startTime,
            endTime: rule.endTime,
            isActive: rule.isActive ?? true,
          })),
        });
      }
    });

    return this.listByTenant(tenantId);
  }
}

function normalizeRules(
  rules: AvailabilityRuleInputDto[] | undefined,
): AvailabilityRuleInputDto[] {
  if (!Array.isArray(rules)) {
    throw new BadRequestException('rules must be an array.');
  }

  return rules.map((rule) => {
    validateRule(rule);

    return {
      weekday: rule.weekday,
      startTime: rule.startTime,
      endTime: rule.endTime,
      isActive: rule.isActive ?? true,
    };
  });
}

function validateRule(rule: AvailabilityRuleInputDto): void {
  if (!Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6) {
    throw new BadRequestException('weekday must be between 0 and 6.');
  }

  if (!isTime(rule.startTime) || !isTime(rule.endTime)) {
    throw new BadRequestException(
      'startTime and endTime must use HH:mm format.',
    );
  }

  if (toMinutes(rule.startTime) >= toMinutes(rule.endTime)) {
    throw new BadRequestException('startTime must be before endTime.');
  }
}

function validateNoOverlaps(rules: AvailabilityRuleInputDto[]): void {
  const rulesByWeekday = new Map<number, AvailabilityRuleInputDto[]>();

  rules
    .filter((rule) => rule.isActive !== false)
    .forEach((rule) => {
      rulesByWeekday.set(rule.weekday, [
        ...(rulesByWeekday.get(rule.weekday) ?? []),
        rule,
      ]);
    });

  rulesByWeekday.forEach((weekdayRules, weekday) => {
    const sortedRules = [...weekdayRules].sort(
      (firstRule, secondRule) =>
        toMinutes(firstRule.startTime) - toMinutes(secondRule.startTime),
    );

    for (let index = 1; index < sortedRules.length; index += 1) {
      const previousRule = sortedRules[index - 1];
      const currentRule = sortedRules[index];

      if (
        previousRule &&
        currentRule &&
        toMinutes(currentRule.startTime) < toMinutes(previousRule.endTime)
      ) {
        throw new BadRequestException(
          `Availability rules overlap for weekday ${weekday}.`,
        );
      }
    }
  });
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}
