import { Body, Controller, ForbiddenException, Get, Logger, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageSender } from '@prisma/client';
import { ConversationsService } from '../conversations/conversations.service';
import { IncomingMessageOrchestratorService } from '../incoming-messages/incoming-message-orchestrator.service';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { parseWhatsappWebhookPayload, type ParsedWhatsappMessage } from './whatsapp-parser';

type WhatsappWebhookVerificationQuery = {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
};

type BufferedWhatsappMessage = ParsedWhatsappMessage & {
  conversationId?: string;
  persistedMessageId?: string;
};

const incomingMessages: BufferedWhatsappMessage[] = [];
// TODO: persist external WhatsApp message ids when Message has an externalMessageId field.
const persistedExternalMessageIds = new Set<string>();

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly conversationsService: ConversationsService,
    private readonly incomingMessageOrchestratorService: IncomingMessageOrchestratorService,
    private readonly messagesService: MessagesService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  verify(@Query() query: WhatsappWebhookVerificationQuery): string {
    const expectedVerifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (expectedVerifyToken && query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === expectedVerifyToken) {
      return query['hub.challenge'] ?? '';
    }

    throw new ForbiddenException('Invalid WhatsApp webhook verification token');
  }

  @Get('messages')
  drainMessages(): BufferedWhatsappMessage[] {
    const messages = [...incomingMessages];
    incomingMessages.length = 0;
    return messages;
  }

  @Post()
  async receive(@Body() body: unknown): Promise<{ ok: true }> {
    const parsedMessages = parseWhatsappWebhookPayload(body);
    const bufferedMessages = parsedMessages.map((message) => ({ ...message }));
    incomingMessages.push(...bufferedMessages);
    this.logger.log(`Parsed WhatsApp webhook messages: ${JSON.stringify({
      count: parsedMessages.length,
      messages: parsedMessages.map((message) => ({
        from: message.from,
        type: message.type,
      })),
    })}`);

    await this.persistParsedMessages(bufferedMessages).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown persistence error';
      this.logger.error(`Could not persist WhatsApp webhook messages: ${message}`);
    });

    return { ok: true };
  }

  private async persistParsedMessages(parsedMessages: BufferedWhatsappMessage[]): Promise<void> {
    if (!parsedMessages.length) {
      return;
    }

    const tenantId = await this.resolveWebhookTenantId();
    if (!tenantId) {
      this.logger.warn('WhatsApp webhook messages were not persisted because no tenant is available.');
      return;
    }

    for (const parsedMessage of parsedMessages) {
      if (
        parsedMessage.externalMessageId &&
        persistedExternalMessageIds.has(parsedMessage.externalMessageId)
      ) {
        continue;
      }

      const conversation = await this.conversationsService.findOrCreateFromWhatsapp({
        tenantId,
        whatsappFrom: parsedMessage.externalConversationId || parsedMessage.from,
        displayName: parsedMessage.contactName,
      });

      const persistedMessage = await this.messagesService.create({
        conversationId: conversation.id,
        sender: MessageSender.CLIENT,
        content: formatParsedMessageContent(parsedMessage),
        skipAutomations: true,
      });
      const orchestrationResult = await this.incomingMessageOrchestratorService.handleIncomingMessage({
        tenantId,
        conversationId: conversation.id,
        content: persistedMessage.content,
        sender: 'client',
        source: 'whatsapp',
      });
      this.logger.log(`Incoming WhatsApp message orchestration: ${JSON.stringify({
        conversationId: conversation.id,
        messageId: persistedMessage.id,
        replyType: orchestrationResult.replyType,
        handled: orchestrationResult.handled,
      })}`);

      parsedMessage.conversationId = conversation.id;
      parsedMessage.persistedMessageId = persistedMessage.id;

      if (parsedMessage.externalMessageId) {
        persistedExternalMessageIds.add(parsedMessage.externalMessageId);
      }
    }
  }

  private async resolveWebhookTenantId(): Promise<string | null> {
    const configuredTenantId = this.configService.get<string>('DEFAULT_TENANT_ID')?.trim();

    if (configuredTenantId) {
      const tenant = await this.prismaService.tenant.findUnique({
        where: {
          id: configuredTenantId,
        },
        select: {
          id: true,
        },
      });

      if (tenant) {
        return tenant.id;
      }

      this.logger.warn('DEFAULT_TENANT_ID is configured but does not match an existing tenant.');
    }

    const firstTenant = await this.prismaService.tenant.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    return firstTenant?.id ?? null;
  }
}

function formatParsedMessageContent(parsedMessage: ParsedWhatsappMessage): string {
  if (parsedMessage.type === 'text') {
    return parsedMessage.text ?? '[text message]';
  }

  if (parsedMessage.type === 'image') {
    return '[image message]';
  }

  if (parsedMessage.type === 'document') {
    return '[document message]';
  }

  if (parsedMessage.type === 'audio') {
    return '[audio message]';
  }

  if (parsedMessage.type === 'video') {
    return '[video message]';
  }

  return '[unknown message]';
}
