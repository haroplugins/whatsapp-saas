import { Injectable } from '@nestjs/common';
import { ConversationControlMode } from '@prisma/client';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  type HandleIncomingMessageInput,
  type HandleIncomingMessageResult,
} from './incoming-message.types';

@Injectable()
export class IncomingMessageOrchestratorService {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Future decision order:
   * 1. Existing automations
   * 2. Off-hours
   * 3. AI
   * 4. Human escalation
   *
   * Task 052C connects this service only to the persisted WhatsApp webhook path.
   * Other message endpoints keep their previous MessagesService behavior.
   */
  async handleIncomingMessage(
    input: HandleIncomingMessageInput,
  ): Promise<HandleIncomingMessageResult> {
    if (input.sender === 'user') {
      return {
        handled: false,
        replyType: 'NO_REPLY',
        reason: 'Messages sent by the user do not trigger incoming-message automation.',
      };
    }

    if (input.sender !== 'client') {
      return {
        handled: false,
        replyType: 'NO_REPLY',
        reason: 'Only client messages are eligible for incoming-message automation.',
      };
    }

    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: input.conversationId,
        tenantId: input.tenantId,
      },
      select: {
        controlMode: true,
      },
    });

    if (!conversation) {
      return {
        handled: false,
        replyType: 'NO_REPLY',
        reason: 'Conversation not found for incoming-message orchestration.',
      };
    }

    if (conversation.controlMode === ConversationControlMode.HUMAN) {
      return {
        handled: false,
        replyType: 'HUMAN_REQUIRED',
        reason: 'Conversation controlled by human.',
      };
    }

    const automationResult = await this.messagesService.runIncomingMessageAutomations({
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      content: input.content,
    });

    if (!automationResult.handled) {
      return {
        handled: false,
        replyType: 'NO_REPLY',
        reason: 'No incoming-message automation matched.',
      };
    }

    return {
      handled: true,
      replyType: 'AUTOMATION_REPLY',
      reason: `Executed existing automation flow (${automationResult.immediateReplies} immediate, ${automationResult.scheduledReplies} scheduled).`,
    };
  }
}
