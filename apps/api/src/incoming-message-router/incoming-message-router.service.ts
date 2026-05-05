import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ActionType,
  AutomaticReplySource,
  AutomaticReplyStatus,
  ConversationControlMode,
  MessageSender,
  type Prisma,
  TriggerType,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { AutomaticReplyPolicyService } from '../automatic-replies/automatic-reply-policy.service';
import { BookingAgentService } from '../booking-agent/booking-agent.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  IncomingMessageReplyCandidate,
  IncomingMessageRouterInternalSendResult,
  IncomingMessageReplyRouterDryRunResultBase,
  IncomingMessageReplyRouterDryRunResult,
} from './incoming-message-router.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_AUTOMATIC_REPLY_LOG_RETENTION_DAYS = 14;
const REPLY_TEXT_PREVIEW_MAX_LENGTH = 300;

@Injectable()
export class IncomingMessageRouterService {
  constructor(
    private readonly automaticReplyPolicyService: AutomaticReplyPolicyService,
    private readonly bookingAgentService: BookingAgentService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async dryRunIncomingReply(
    tenantId: string,
    conversationId: string,
    messageId: string,
  ): Promise<IncomingMessageReplyRouterDryRunResult> {
    const result = await this.evaluateIncomingReply(
      tenantId,
      conversationId,
      messageId,
    );
    await this.createAutomaticReplyLog(tenantId, result);
    return result;
  }

  async internalSendIncomingReply(
    tenantId: string,
    conversationId: string,
    messageId: string,
  ): Promise<IncomingMessageRouterInternalSendResult> {
    const result = await this.evaluateIncomingReply(
      tenantId,
      conversationId,
      messageId,
    );
    const selectedCandidate = this.getSelectedCandidate(result);
    const replyText = selectedCandidate?.replyTextPreview.trim() ?? '';

    if (result.decision.type === 'NO_REPLY') {
      throw new BadRequestException('Message is not eligible for an AI reply.');
    }

    if (result.controlMode !== ConversationControlMode.AI) {
      throw new BadRequestException(
        'Conversation must be in AI control mode for internal send.',
      );
    }

    if (result.decision.selectedSource !== 'BOOKING_ADVISOR') {
      throw new BadRequestException(
        'Only Booking Advisor internal send is supported.',
      );
    }

    if (!selectedCandidate) {
      throw new BadRequestException('Selected reply candidate was not found.');
    }

    if (!replyText) {
      throw new BadRequestException('Selected reply candidate is empty.');
    }

    if (!result.sendPolicy.eligibleToSend) {
      throw new BadRequestException({
        message: 'Automatic reply is not eligible to send.',
        blockReasons: result.sendPolicy.blockReasons,
      });
    }

    if (result.sendPolicy.dryRunOnly !== true) {
      throw new BadRequestException('Automatic reply policy must be dry-run only.');
    }

    if (result.decision.shouldSendMessage !== false) {
      throw new BadRequestException('Router dry-run send flag must remain false.');
    }

    if (result.sendPolicy.wouldUseSender !== MessageSender.AI) {
      throw new BadRequestException('Automatic reply must use AI sender.');
    }

    const expiresAt = new Date(
      Date.now() + this.getAutomaticReplyLogRetentionDays() * DAY_MS,
    );
    const { automaticReplyLog, sentMessage } =
      await this.prismaService.$transaction(async (transaction) => {
        const existingSentLog = await transaction.automaticReplyLog.count({
          where: {
            tenantId,
            triggeringMessageId: messageId,
            status: AutomaticReplyStatus.SENT,
          },
        });

        if (existingSentLog > 0) {
          throw new ConflictException(
            'An automatic reply was already sent for this triggering message.',
          );
        }

        const sentMessage = await transaction.message.create({
          data: {
            conversationId,
            sender: MessageSender.AI,
            content: replyText,
          },
          select: {
            id: true,
            sender: true,
            content: true,
          },
        });
        const automaticReplyLog = await transaction.automaticReplyLog.create({
          data: {
            tenantId,
            conversationId,
            triggeringMessageId: messageId,
            sentMessageId: sentMessage.id,
            source: AutomaticReplySource.BOOKING_ADVISOR,
            routerDecision: result.decision.type,
            selectedSource: 'BOOKING_ADVISOR',
            status: AutomaticReplyStatus.SENT,
            reason: 'Internal AI message created. External delivery disabled.',
            replyTextPreview: truncateText(replyText),
            replyTextHash: hashText(replyText),
            resultJson: buildAutomaticReplyLogResultJson(result, {
              deliveryMode: 'INTERNAL_DB_ONLY',
              externalDelivery: false,
            }),
            expiresAt,
          },
          select: {
            id: true,
            status: true,
            source: true,
          },
        });

        return {
          automaticReplyLog,
          sentMessage,
        };
      });

    return {
      ok: true,
      mode: 'internal_ai_message_created',
      externalDelivery: false,
      deliveryMode: 'INTERNAL_DB_ONLY',
      conversationId,
      triggeringMessageId: messageId,
      sentMessage: {
        id: sentMessage.id,
        sender: 'AI',
        content: sentMessage.content,
      },
      automaticReplyLog: {
        id: automaticReplyLog.id,
        status: 'SENT',
        source: 'BOOKING_ADVISOR',
      },
      router: {
        decisionType: result.decision.type,
        selectedSource: 'BOOKING_ADVISOR',
        sendPolicyEligible: true,
      },
    };
  }

  private async evaluateIncomingReply(
    tenantId: string,
    conversationId: string,
    messageId: string,
  ): Promise<IncomingMessageReplyRouterDryRunResult> {
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
      select: {
        id: true,
        controlMode: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    const message = await this.prismaService.message.findFirst({
      where: {
        id: messageId,
        conversationId,
      },
      select: {
        id: true,
        sender: true,
        content: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (message.sender !== MessageSender.CLIENT) {
      return this.buildRouterResultWithPolicy(tenantId, {
        conversationId,
        messageId,
        controlMode: conversation.controlMode,
        candidates: [],
        decisionType: 'NO_REPLY',
        selectedSource: null,
        reason: 'Only client messages are eligible for automatic replies.',
      });
    }

    if (conversation.controlMode === ConversationControlMode.HUMAN) {
      return this.buildRouterResultWithPolicy(tenantId, {
        conversationId,
        messageId,
        controlMode: conversation.controlMode,
        candidates: [],
        decisionType: 'BLOCKED_BY_CONTROL_MODE',
        selectedSource: null,
        reason: 'Conversation is controlled by a human.',
      });
    }

    const classicAutomationCandidates =
      await this.getClassicAutomationCandidates({
        tenantId,
        messageContent: message.content,
      });
    const bookingAdvisorCandidate = await this.getBookingAdvisorCandidate(
      tenantId,
      message.content,
    );
    const candidates = [
      ...classicAutomationCandidates,
      ...(bookingAdvisorCandidate ? [bookingAdvisorCandidate] : []),
    ];

    if (candidates.length === 0) {
      return this.buildRouterResultWithPolicy(tenantId, {
        conversationId,
        messageId,
        controlMode: conversation.controlMode,
        candidates,
        decisionType: 'NO_REPLY',
        selectedSource: null,
        reason: 'No automatic reply candidates found.',
      });
    }

    if (candidates.length > 1) {
      return this.buildRouterResultWithPolicy(tenantId, {
        conversationId,
        messageId,
        controlMode: conversation.controlMode,
        candidates,
        decisionType: 'CONFLICT_MULTIPLE_REPLIES',
        selectedSource: null,
        reason: 'Multiple reply candidates found. Automatic sending is disabled.',
      });
    }

    const candidate = candidates[0]!;

    if (candidate.source === 'CLASSIC_AUTOMATION') {
      return this.buildRouterResultWithPolicy(tenantId, {
        conversationId,
        messageId,
        controlMode: conversation.controlMode,
        candidates,
        decisionType: 'CLASSIC_AUTOMATION_WOULD_REPLY',
        selectedSource: 'CLASSIC_AUTOMATION',
        reason: 'One classic automation reply candidate found.',
      });
    }

    return this.buildRouterResultWithPolicy(tenantId, {
      conversationId,
      messageId,
      controlMode: conversation.controlMode,
      candidates,
      decisionType: 'BOOKING_ADVISOR_WOULD_REPLY',
      selectedSource: 'BOOKING_ADVISOR',
      reason: 'One Booking Advisor reply candidate found.',
    });
  }

  private async buildRouterResultWithPolicy(
    tenantId: string,
    input: Parameters<typeof buildRouterResult>[0],
  ): Promise<IncomingMessageReplyRouterDryRunResult> {
    const baseResult = buildRouterResult(input);
    const sendPolicy = await this.automaticReplyPolicyService.evaluate({
      tenantId,
      conversation: {
        id: input.conversationId,
        controlMode: input.controlMode,
      },
      triggeringMessage: {
        id: input.messageId,
      },
      routerResult: baseResult,
    });
    const result: IncomingMessageReplyRouterDryRunResult = {
      ...baseResult,
      sendPolicy,
    };
    return result;
  }

  private getSelectedCandidate(
    result: IncomingMessageReplyRouterDryRunResult,
  ): IncomingMessageReplyCandidate | null {
    return result.decision.selectedSource
      ? result.candidates.find(
          (candidate) => candidate.source === result.decision.selectedSource,
        ) ?? null
      : null;
  }

  private async createAutomaticReplyLog(
    tenantId: string,
    result: IncomingMessageReplyRouterDryRunResult,
  ): Promise<void> {
    const selectedCandidate = result.decision.selectedSource
      ? result.candidates.find(
          (candidate) => candidate.source === result.decision.selectedSource,
        )
      : null;
    const replyTextPreview = selectedCandidate
      ? truncateText(selectedCandidate.replyTextPreview)
      : null;
    const expiresAt = new Date(
      Date.now() + this.getAutomaticReplyLogRetentionDays() * DAY_MS,
    );

    await this.prismaService.automaticReplyLog.create({
      data: {
        tenantId,
        conversationId: result.conversationId,
        triggeringMessageId: result.messageId,
        sentMessageId: null,
        source: mapAutomaticReplySource(result.decision.selectedSource),
        routerDecision: result.decision.type,
        selectedSource: result.decision.selectedSource,
        status: AutomaticReplyStatus.DRY_RUN,
        reason: result.decision.reason,
        replyTextPreview,
        replyTextHash: selectedCandidate
          ? hashText(selectedCandidate.replyTextPreview)
          : null,
        resultJson: buildAutomaticReplyLogResultJson(result),
        expiresAt,
      },
    });
  }

  private getAutomaticReplyLogRetentionDays(): number {
    const value = this.configService.get<string>(
      'AUTOMATIC_REPLY_LOG_RETENTION_DAYS',
    );
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return DEFAULT_AUTOMATIC_REPLY_LOG_RETENTION_DAYS;
    }

    return parsed;
  }

  private async getClassicAutomationCandidates(input: {
    tenantId: string;
    messageContent: string;
  }): Promise<IncomingMessageReplyCandidate[]> {
    const automations = await this.prismaService.automation.findMany({
      where: {
        tenantId: input.tenantId,
        isActive: true,
        actionType: ActionType.SEND_MESSAGE,
        triggerType: {
          in: [TriggerType.KEYWORD, TriggerType.TIME_DELAY],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        triggerType: true,
        triggerValue: true,
        actionValue: true,
      },
    });
    const normalizedMessage = normalizeText(input.messageContent);
    const candidates: IncomingMessageReplyCandidate[] = [];

    for (const automation of automations) {
      if (automation.triggerType === TriggerType.KEYWORD) {
        const normalizedKeyword = normalizeText(automation.triggerValue);

        if (
          normalizedKeyword.length > 0 &&
          normalizedMessage.includes(normalizedKeyword)
        ) {
          candidates.push({
            source: 'CLASSIC_AUTOMATION',
            wouldReply: true,
            reason: 'KEYWORD_MATCH',
            replyTextPreview: automation.actionValue,
            automationId: automation.id,
            automationName: automation.name,
          });
        }
      }

      if (
        automation.triggerType === TriggerType.TIME_DELAY &&
        parseDelayToMs(automation.triggerValue) !== null
      ) {
        candidates.push({
          source: 'CLASSIC_AUTOMATION',
          wouldReply: true,
          reason: 'TIME_DELAY_MATCH',
          replyTextPreview: automation.actionValue,
          automationId: automation.id,
          automationName: automation.name,
        });
      }
    }

    return candidates;
  }

  private async getBookingAdvisorCandidate(
    tenantId: string,
    messageContent: string,
  ): Promise<IncomingMessageReplyCandidate | null> {
    const orchestratorResult = await this.bookingAgentService.orchestrate(
      tenantId,
      messageContent,
    );

    if (!orchestratorResult.suggestedReply.prepared) {
      return null;
    }

    return {
      source: 'BOOKING_ADVISOR',
      wouldReply: true,
      reason: orchestratorResult.deterministicIntent.intent,
      replyTextPreview: orchestratorResult.suggestedReply.text,
    };
  }
}

function buildRouterResult(input: {
  conversationId: string;
  messageId: string;
  controlMode: ConversationControlMode;
  candidates: IncomingMessageReplyCandidate[];
  decisionType: IncomingMessageReplyRouterDryRunResult['decision']['type'];
  selectedSource: IncomingMessageReplyRouterDryRunResult['decision']['selectedSource'];
  reason: string;
}): IncomingMessageReplyRouterDryRunResultBase {
  return {
    ok: true,
    mode: 'incoming_reply_router_dry_run',
    conversationId: input.conversationId,
    messageId: input.messageId,
    controlMode: input.controlMode,
    candidates: input.candidates,
    decision: {
      type: input.decisionType,
      selectedSource: input.selectedSource,
      shouldSendMessage: false,
      reason: input.reason,
    },
  };
}

function mapAutomaticReplySource(
  selectedSource: IncomingMessageReplyRouterDryRunResult['decision']['selectedSource'],
): AutomaticReplySource | null {
  if (selectedSource === 'BOOKING_ADVISOR') {
    return AutomaticReplySource.BOOKING_ADVISOR;
  }

  if (selectedSource === 'CLASSIC_AUTOMATION') {
    return AutomaticReplySource.CLASSIC_AUTOMATION;
  }

  return null;
}

function buildAutomaticReplyLogResultJson(
  result: IncomingMessageReplyRouterDryRunResult,
  delivery?: {
    deliveryMode: 'INTERNAL_DB_ONLY';
    externalDelivery: false;
  },
): Prisma.InputJsonObject {
  return {
    mode: result.mode,
    controlMode: result.controlMode,
    candidateSources: result.candidates.map((candidate) => candidate.source),
    candidateReasons: result.candidates.map((candidate) => candidate.reason),
    candidateCount: result.candidates.length,
    decisionType: result.decision.type,
    selectedSource: result.decision.selectedSource,
    shouldSendMessage: result.decision.shouldSendMessage,
    sendPolicy: {
      eligibleToSend: result.sendPolicy.eligibleToSend,
      dryRunOnly: result.sendPolicy.dryRunOnly,
      wouldUseSender: result.sendPolicy.wouldUseSender,
      selectedSource: result.sendPolicy.selectedSource,
      blockReasons: result.sendPolicy.blockReasons,
      limits: result.sendPolicy.limits,
    },
    ...(delivery
      ? {
          deliveryMode: delivery.deliveryMode,
          externalDelivery: delivery.externalDelivery,
        }
      : {}),
  };
}

function truncateText(text: string): string {
  return text.length > REPLY_TEXT_PREVIEW_MAX_LENGTH
    ? text.slice(0, REPLY_TEXT_PREVIEW_MAX_LENGTH)
    : text;
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseDelayToMs(triggerValue: string): number | null {
  const normalizedValue = triggerValue.trim().toLowerCase();
  const match = /^(\d+)([smh])$/.exec(normalizedValue);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }

  if (unit === 's') {
    return amount * 1000;
  }

  if (unit === 'm') {
    return amount * 60 * 1000;
  }

  if (unit === 'h') {
    return amount * 60 * 60 * 1000;
  }

  return null;
}
