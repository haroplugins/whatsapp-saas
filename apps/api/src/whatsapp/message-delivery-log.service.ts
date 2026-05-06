import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageDeliveryDirection,
  MessageDeliveryProvider,
  MessageDeliveryStatus,
  type Prisma,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { WhatsappSanitizedConfig } from './whatsapp-cloud.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MESSAGE_DELIVERY_LOG_RETENTION_DAYS = 30;
const ERROR_FIELD_MAX_LENGTH = 500;

type DeliveryLogBaseInput = {
  tenantId: string;
  conversationId: string;
  messageId: string;
  recipientPhone: string;
  messageText: string;
  config: WhatsappSanitizedConfig;
};

type DeliveryLogErrorInput = {
  httpStatus?: number | null;
  errorCode?: string | null;
  errorType?: string | null;
  errorMessage?: string | null;
};

@Injectable()
export class MessageDeliveryLogService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  createDryRunLog(input: DeliveryLogBaseInput) {
    return this.createDeliveryLog({
      ...input,
      status: MessageDeliveryStatus.DRY_RUN,
      dryRun: true,
      externalDelivery: false,
      deliveryMode: 'WHATSAPP_CLOUD_API_DRY_RUN',
    });
  }

  createBlockedLog(input: DeliveryLogBaseInput & DeliveryLogErrorInput) {
    return this.createDeliveryLog({
      ...input,
      status: MessageDeliveryStatus.BLOCKED,
      dryRun: false,
      externalDelivery: false,
      deliveryMode: 'WHATSAPP_CLOUD_API_BLOCKED',
      httpStatus: input.httpStatus,
      errorCode: input.errorCode,
      errorType: input.errorType,
      errorMessage: input.errorMessage,
    });
  }

  createSentLog(
    input: DeliveryLogBaseInput & {
      externalMessageId?: string | null;
      httpStatus?: number | null;
    },
  ) {
    return this.createDeliveryLog({
      ...input,
      status: MessageDeliveryStatus.SENT,
      dryRun: false,
      externalDelivery: true,
      deliveryMode: 'WHATSAPP_CLOUD_API',
      externalMessageId: input.externalMessageId,
      httpStatus: input.httpStatus,
    });
  }

  createFailedLog(input: DeliveryLogBaseInput & DeliveryLogErrorInput) {
    return this.createDeliveryLog({
      ...input,
      status: MessageDeliveryStatus.FAILED,
      dryRun: false,
      externalDelivery: false,
      deliveryMode: 'WHATSAPP_CLOUD_API',
      httpStatus: input.httpStatus,
      errorCode: input.errorCode,
      errorType: input.errorType,
      errorMessage: input.errorMessage,
    });
  }

  private createDeliveryLog(
    input: DeliveryLogBaseInput &
      DeliveryLogErrorInput & {
        status: MessageDeliveryStatus;
        dryRun: boolean;
        externalDelivery: boolean;
        deliveryMode: string;
        externalMessageId?: string | null;
      },
  ) {
    const normalizedPhone = normalizePhone(input.recipientPhone);
    const recipientHash = normalizedPhone ? hashText(normalizedPhone) : null;
    const resultJson = buildResultJson({
      config: input.config,
      status: input.status,
      dryRun: input.dryRun,
      externalDelivery: input.externalDelivery,
      deliveryMode: input.deliveryMode,
      textLength: input.messageText.length,
      wouldSendToHash: recipientHash,
      httpStatus: input.httpStatus,
      wamidPresent: Boolean(input.externalMessageId),
    });

    return this.prismaService.messageDeliveryLog.create({
      data: {
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        provider: MessageDeliveryProvider.WHATSAPP_CLOUD_API,
        direction: MessageDeliveryDirection.OUTBOUND,
        status: input.status,
        externalMessageId: input.externalMessageId ?? null,
        phoneNumberId: input.config.phoneNumberId,
        recipientHash,
        httpStatus: input.httpStatus ?? null,
        errorCode: truncateNullable(input.errorCode),
        errorType: truncateNullable(input.errorType),
        errorMessage: truncateNullable(input.errorMessage),
        resultJson,
        expiresAt: this.buildExpiresAt(),
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  private buildExpiresAt(): Date {
    return new Date(
      Date.now() + this.getRetentionDays() * DAY_MS,
    );
  }

  private getRetentionDays(): number {
    const value = this.configService.get<string>(
      'MESSAGE_DELIVERY_LOG_RETENTION_DAYS',
    );
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return DEFAULT_MESSAGE_DELIVERY_LOG_RETENTION_DAYS;
    }

    return parsed;
  }
}

function buildResultJson(input: {
  config: WhatsappSanitizedConfig;
  status: MessageDeliveryStatus;
  dryRun: boolean;
  externalDelivery: boolean;
  deliveryMode: string;
  textLength: number;
  wouldSendToHash: string | null;
  httpStatus?: number | null;
  wamidPresent: boolean;
}): Prisma.InputJsonObject {
  return {
    provider: MessageDeliveryProvider.WHATSAPP_CLOUD_API,
    direction: MessageDeliveryDirection.OUTBOUND,
    status: input.status,
    dryRun: input.dryRun,
    externalDelivery: input.externalDelivery,
    deliveryMode: input.deliveryMode,
    phoneNumberIdConfigured: Boolean(input.config.phoneNumberId),
    apiVersionConfigured: Boolean(input.config.apiVersion),
    outboundEnabled: input.config.outboundEnabled,
    outboundDryRun: input.config.outboundDryRun,
    allowedTestRecipientsConfigured:
      input.config.allowedTestRecipients.length > 0,
    payloadType: 'text',
    textLength: input.textLength,
    wouldSendToHash: input.wouldSendToHash,
    httpStatus: input.httpStatus ?? null,
    wamidPresent: input.wamidPresent,
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function truncateNullable(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.length > ERROR_FIELD_MAX_LENGTH
    ? value.slice(0, ERROR_FIELD_MAX_LENGTH)
    : value;
}
