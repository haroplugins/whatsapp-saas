import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import {
  type HandleIncomingMessageInput,
  type HandleIncomingMessageResult,
} from './incoming-message.types';

@Injectable()
export class IncomingMessageOrchestratorService {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Future decision order:
   * 1. Existing automations
   * 2. Off-hours
   * 3. AI
   * 4. Human escalation
   *
   * Task 052A keeps this service registered but not connected to controllers or
   * webhooks, so existing production behavior stays unchanged.
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

    await this.messagesService.runIncomingMessageAutomations({
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      content: input.content,
    });

    return {
      handled: true,
      replyType: 'AUTOMATION_REPLY',
      reason: 'Delegated to the existing automation flow. Off-hours, AI, and human escalation are reserved for future tasks.',
    };
  }
}
