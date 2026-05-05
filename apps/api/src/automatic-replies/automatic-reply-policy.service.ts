import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AutomaticReplyStatus,
  ConversationControlMode,
  MessageSender,
} from '@prisma/client';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AutomaticReplySendPolicy,
  AutomaticReplySendPolicyBlockReason,
} from './automatic-reply-policy.types';
import type { IncomingMessageReplyRouterDryRunResultBase } from '../incoming-message-router/incoming-message-router.types';

const DEFAULT_COOLDOWN_SECONDS = 300;
const DEFAULT_MAX_PER_CONVERSATION_DAY = 3;
const DEFAULT_MAX_PER_TENANT_HOUR = 20;
const DEFAULT_MAX_PER_TENANT_DAY = 100;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

@Injectable()
export class AutomaticReplyPolicyService {
  constructor(
    private readonly configService: ConfigService,
    private readonly entitlementsService: EntitlementsService,
    private readonly prismaService: PrismaService,
  ) {}

  async evaluate(input: {
    tenantId: string;
    conversation: {
      id: string;
      controlMode: ConversationControlMode;
    };
    triggeringMessage: {
      id: string;
    };
    routerResult: IncomingMessageReplyRouterDryRunResultBase;
  }): Promise<AutomaticReplySendPolicy> {
    const limits = this.getLimits();
    const blockReasons: AutomaticReplySendPolicyBlockReason[] = [];
    const selectedSource = input.routerResult.decision.selectedSource;

    if (input.routerResult.decision.type === 'CONFLICT_MULTIPLE_REPLIES') {
      blockReasons.push('CONFLICT_MULTIPLE_REPLIES');
    }

    if (input.routerResult.decision.type === 'BLOCKED_BY_CONTROL_MODE') {
      blockReasons.push('CONTROL_MODE_BLOCKED');
    }

    if (input.routerResult.decision.type === 'NO_REPLY') {
      blockReasons.push('NO_REPLY');
    }

    if (!selectedSource) {
      blockReasons.push('NO_SELECTED_SOURCE');
    }

    if (input.conversation.controlMode === ConversationControlMode.HUMAN) {
      blockReasons.push('CONTROL_MODE_HUMAN');
    }

    if (input.conversation.controlMode !== ConversationControlMode.AI) {
      blockReasons.push('CONTROL_MODE_NOT_AI');
    }

    if (!readBooleanEnv(this.configService, 'AUTOMATIC_REPLIES_ENABLED')) {
      blockReasons.push('AUTOMATIC_REPLIES_DISABLED');
    }

    if (selectedSource === 'BOOKING_ADVISOR') {
      await this.evaluateBookingAdvisorRules(input.tenantId, blockReasons);
    }

    if (selectedSource === 'CLASSIC_AUTOMATION') {
      blockReasons.push('CLASSIC_AUTOMATION_AUTOREPLY_NOT_SUPPORTED');
    }

    await this.evaluateHistoryRules(
      input.tenantId,
      input.conversation.id,
      input.triggeringMessage.id,
      limits,
      blockReasons,
    );

    return {
      eligibleToSend: blockReasons.length === 0,
      dryRunOnly: true,
      wouldUseSender:
        selectedSource === 'BOOKING_ADVISOR' ? MessageSender.AI : null,
      selectedSource,
      blockReasons: uniqueBlockReasons(blockReasons),
      limits,
    };
  }

  private async evaluateBookingAdvisorRules(
    tenantId: string,
    blockReasons: AutomaticReplySendPolicyBlockReason[],
  ): Promise<void> {
    if (
      !readBooleanEnv(this.configService, 'BOOKING_ADVISOR_AUTOREPLY_ENABLED')
    ) {
      blockReasons.push('BOOKING_ADVISOR_AUTOREPLY_DISABLED');
    }

    const entitlements =
      await this.entitlementsService.getTenantEntitlements(tenantId);

    if (!entitlements.features.canUseSmartBooking) {
      blockReasons.push('PLAN_NOT_ALLOWED');
    }

    const smartBookingSettings =
      await this.prismaService.smartBookingSettings.findUnique({
        where: {
          tenantId,
        },
        select: {
          enabled: true,
        },
      });

    if (!smartBookingSettings?.enabled) {
      blockReasons.push('SMART_BOOKING_DISABLED');
    }
  }

  private async evaluateHistoryRules(
    tenantId: string,
    conversationId: string,
    triggeringMessageId: string,
    limits: AutomaticReplySendPolicy['limits'],
    blockReasons: AutomaticReplySendPolicyBlockReason[],
  ): Promise<void> {
    const now = Date.now();
    const cooldownCutoff = new Date(now - limits.cooldownSeconds * 1000);
    const hourCutoff = new Date(now - HOUR_MS);
    const dayCutoff = new Date(now - DAY_MS);

    const [
      sentForTriggeringMessage,
      sentInConversationCooldown,
      sentInConversationDay,
      sentInTenantHour,
      sentInTenantDay,
    ] = await Promise.all([
      this.prismaService.automaticReplyLog.count({
        where: {
          tenantId,
          triggeringMessageId,
          status: AutomaticReplyStatus.SENT,
        },
      }),
      this.prismaService.automaticReplyLog.count({
        where: {
          tenantId,
          conversationId,
          status: AutomaticReplyStatus.SENT,
          createdAt: {
            gte: cooldownCutoff,
          },
        },
      }),
      this.prismaService.automaticReplyLog.count({
        where: {
          tenantId,
          conversationId,
          status: AutomaticReplyStatus.SENT,
          createdAt: {
            gte: dayCutoff,
          },
        },
      }),
      this.prismaService.automaticReplyLog.count({
        where: {
          tenantId,
          status: AutomaticReplyStatus.SENT,
          createdAt: {
            gte: hourCutoff,
          },
        },
      }),
      this.prismaService.automaticReplyLog.count({
        where: {
          tenantId,
          status: AutomaticReplyStatus.SENT,
          createdAt: {
            gte: dayCutoff,
          },
        },
      }),
    ]);

    if (sentForTriggeringMessage > 0) {
      blockReasons.push('ALREADY_SENT_FOR_TRIGGERING_MESSAGE');
    }

    if (sentInConversationCooldown > 0) {
      blockReasons.push('CONVERSATION_COOLDOWN_ACTIVE');
    }

    if (sentInConversationDay >= limits.maxPerConversationDay) {
      blockReasons.push('CONVERSATION_DAILY_LIMIT_REACHED');
    }

    if (sentInTenantHour >= limits.maxPerTenantHour) {
      blockReasons.push('TENANT_HOURLY_LIMIT_REACHED');
    }

    if (sentInTenantDay >= limits.maxPerTenantDay) {
      blockReasons.push('TENANT_DAILY_LIMIT_REACHED');
    }
  }

  private getLimits(): AutomaticReplySendPolicy['limits'] {
    return {
      cooldownSeconds: readPositiveIntegerEnv(
        this.configService,
        'AUTOMATIC_REPLY_CONVERSATION_COOLDOWN_SECONDS',
        DEFAULT_COOLDOWN_SECONDS,
      ),
      maxPerConversationDay: readPositiveIntegerEnv(
        this.configService,
        'AUTOMATIC_REPLY_MAX_PER_CONVERSATION_DAY',
        DEFAULT_MAX_PER_CONVERSATION_DAY,
      ),
      maxPerTenantHour: readPositiveIntegerEnv(
        this.configService,
        'AUTOMATIC_REPLY_MAX_PER_TENANT_HOUR',
        DEFAULT_MAX_PER_TENANT_HOUR,
      ),
      maxPerTenantDay: readPositiveIntegerEnv(
        this.configService,
        'AUTOMATIC_REPLY_MAX_PER_TENANT_DAY',
        DEFAULT_MAX_PER_TENANT_DAY,
      ),
    };
  }
}

function readBooleanEnv(configService: ConfigService, key: string): boolean {
  return configService.get<string>(key) === 'true';
}

function readPositiveIntegerEnv(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const value = configService.get<string>(key);
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function uniqueBlockReasons(
  blockReasons: AutomaticReplySendPolicyBlockReason[],
): AutomaticReplySendPolicyBlockReason[] {
  return [...new Set(blockReasons)];
}
