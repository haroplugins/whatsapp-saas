import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MessageSender } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MessageDeliveryLogService } from './message-delivery-log.service';
import { WhatsappCloudService } from './whatsapp-cloud.service';
import {
  type WhatsappOutboundSendBody,
  type WhatsappOutboundSendResult,
  type WhatsappSendTextResult,
} from './whatsapp-cloud.types';

@Controller('whatsapp/outbound')
@UseGuards(JwtAuthGuard)
export class WhatsappOutboundController {
  constructor(
    private readonly messageDeliveryLogService: MessageDeliveryLogService,
    private readonly prismaService: PrismaService,
    private readonly whatsappCloudService: WhatsappCloudService,
  ) {}

  @Post('conversations/:conversationId/messages/:messageId/send')
  async sendExistingAiMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() body: WhatsappOutboundSendBody = {},
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<WhatsappOutboundSendResult> {
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: currentUser.tenantId,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    if (!conversation.phone?.trim()) {
      throw new BadRequestException('Conversation does not have a phone number.');
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

    if (message.sender !== MessageSender.AI) {
      throw new BadRequestException(
        'Only AI messages can be prepared for WhatsApp outbound in this endpoint.',
      );
    }

    const config = this.whatsappCloudService.getSanitizedConfig();
    const requestedDryRun =
      typeof body.dryRun === 'boolean' ? body.dryRun : config.outboundDryRun;
    const effectiveDryRun = config.outboundDryRun || requestedDryRun !== false;

    if (!effectiveDryRun && body.confirmExternalDelivery !== true) {
      if (body.dryRun === false) {
        await this.messageDeliveryLogService.createBlockedLog({
          tenantId: currentUser.tenantId,
          conversationId,
          messageId,
          recipientPhone: conversation.phone,
          messageText: message.content,
          config,
          errorCode: 'CONFIRM_EXTERNAL_DELIVERY_REQUIRED',
          errorType: 'VALIDATION_ERROR',
          errorMessage:
            'External WhatsApp delivery requires confirmExternalDelivery=true.',
        });
      }

      throw new BadRequestException(
        'External WhatsApp delivery requires confirmExternalDelivery=true.',
      );
    }

    let sendResult: WhatsappSendTextResult;

    try {
      sendResult = await this.whatsappCloudService.sendText({
        to: conversation.phone,
        text: message.content,
        correlationId: message.id,
        dryRun: effectiveDryRun,
      });
    } catch (error) {
      if (!effectiveDryRun) {
        const deliveryError = extractDeliveryError(error);
        await this.messageDeliveryLogService.createFailedLog({
          tenantId: currentUser.tenantId,
          conversationId,
          messageId,
          recipientPhone: conversation.phone,
          messageText: message.content,
          config,
          httpStatus: deliveryError.httpStatus,
          errorCode: deliveryError.errorCode,
          errorType: deliveryError.errorType,
          errorMessage: deliveryError.errorMessage,
        });
      }

      throw error;
    }

    if (sendResult.dryRun) {
      const deliveryLog = await this.messageDeliveryLogService.createDryRunLog({
        tenantId: currentUser.tenantId,
        conversationId,
        messageId,
        recipientPhone: conversation.phone,
        messageText: message.content,
        config: sendResult.config,
      });

      return {
        ok: true,
        mode: 'whatsapp_outbound_dry_run',
        conversationId,
        messageId,
        messageSender: message.sender,
        externalDelivery: false,
        provider: sendResult.provider,
        dryRun: true,
        wouldSendTo: sendResult.wouldSendTo,
        payloadPreview: sendResult.payloadPreview,
        config: sendResult.config,
        deliveryLog,
      };
    }

    const deliveryLog = await this.messageDeliveryLogService.createSentLog({
      tenantId: currentUser.tenantId,
      conversationId,
      messageId,
      recipientPhone: conversation.phone,
      messageText: message.content,
      config,
      externalMessageId: sendResult.wamid,
      httpStatus: sendResult.httpStatus,
    });

    return {
      ok: true,
      mode: 'whatsapp_outbound_sent',
      conversationId,
      messageId,
      messageSender: message.sender,
      externalDelivery: true,
      provider: sendResult.provider,
      dryRun: false,
      httpStatus: sendResult.httpStatus,
      wamid: sendResult.wamid,
      rawResultMinimized: sendResult.rawResultMinimized,
      deliveryLog,
    };
  }
}

function extractDeliveryError(error: unknown): {
  httpStatus: number | null;
  errorCode: string | null;
  errorType: string | null;
  errorMessage: string | null;
} {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    const httpStatus = extractHttpStatus(response) ?? error.getStatus();
    const nestedError = isRecord(response) && isRecord(response.error)
      ? response.error
      : null;

    return {
      httpStatus,
      errorCode: stringifyNullable(nestedError?.code),
      errorType: stringifyNullable(nestedError?.type),
      errorMessage:
        stringifyNullable(nestedError?.message) ??
        extractErrorMessage(response) ??
        error.message,
    };
  }

  return {
    httpStatus: null,
    errorCode: null,
    errorType: null,
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
  };
}

function extractHttpStatus(response: unknown): number | null {
  if (!isRecord(response) || typeof response.httpStatus !== 'number') {
    return null;
  }

  return response.httpStatus;
}

function extractErrorMessage(response: unknown): string | null {
  if (typeof response === 'string') {
    return response;
  }

  if (isRecord(response) && typeof response.message === 'string') {
    return response.message;
  }

  return null;
}

function stringifyNullable(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
