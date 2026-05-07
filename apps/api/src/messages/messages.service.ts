import { Injectable } from '@nestjs/common';
import {
  ActionType,
  Automation,
  ConversationControlMode,
  Message,
  MessageExternalProvider,
  MessageSender,
  TriggerType,
} from '@prisma/client';
import { AutomationsService } from '../automations/automations.service';
import { PrismaService } from '../prisma/prisma.service';

type CreateMessageInput = {
  conversationId: string;
  sender: MessageSender;
  content: string;
  externalProvider?: MessageExternalProvider | null;
  externalMessageId?: string | null;
  skipAutomations?: boolean;
};

export type RunIncomingMessageAutomationsInput = {
  tenantId: string;
  conversationId: string;
  content: string;
};

export type RunIncomingMessageAutomationsResult = {
  handled: boolean;
  immediateReplies: number;
  scheduledReplies: number;
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly automationsService: AutomationsService,
  ) {}

  async create(data: CreateMessageInput): Promise<Message> {
    const { skipAutomations = false, ...messageData } = data;
    const conversation = await this.prismaService.conversation.findUniqueOrThrow({
      where: {
        id: data.conversationId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });

    const message = await this.prismaService.message.create({
      data: messageData,
    });

    if (data.sender === MessageSender.USER) {
      await this.markConversationHumanControlled(conversation.id);
    } else if (data.sender === MessageSender.CLIENT && !skipAutomations) {
      await this.runIncomingMessageAutomations({
        tenantId: conversation.tenantId,
        conversationId: conversation.id,
        content: data.content,
      });
    }

    return message;
  }

  async markConversationHumanControlled(conversationId: string): Promise<void> {
    await this.prismaService.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        controlMode: ConversationControlMode.HUMAN,
      },
    });
  }

  listByConversation(conversationId: string): Promise<Message[]> {
    return this.prismaService.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async runIncomingMessageAutomations(
    input: RunIncomingMessageAutomationsInput,
  ): Promise<RunIncomingMessageAutomationsResult> {
    const { tenantId, conversationId, content } = input;
    const automations = await this.automationsService.listActiveByTenant(tenantId);
    const normalizedMessage = this.normalizeText(content);
    let immediateReplies = 0;
    let scheduledReplies = 0;

    for (const automation of automations) {
      if (automation.actionType !== ActionType.SEND_MESSAGE) {
        continue;
      }

      if (automation.triggerType === TriggerType.KEYWORD) {
        const normalizedKeyword = this.normalizeText(automation.triggerValue);

        if (
          normalizedKeyword.length > 0 &&
          normalizedMessage.includes(normalizedKeyword)
        ) {
          await this.createAutomatedMessage(conversationId, automation.actionValue);
          immediateReplies += 1;
        }
      }

      if (automation.triggerType === TriggerType.TIME_DELAY) {
        if (this.scheduleDelayedAutomation(tenantId, conversationId, automation)) {
          scheduledReplies += 1;
        }
      }
    }

    return {
      handled: immediateReplies + scheduledReplies > 0,
      immediateReplies,
      scheduledReplies,
    };
  }

  private normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private async createAutomatedMessage(
    conversationId: string,
    content: string,
  ): Promise<void> {
    await this.prismaService.message.create({
      data: {
        conversationId,
        sender: MessageSender.USER,
        content,
      },
    });
  }

  private scheduleDelayedAutomation(
    tenantId: string,
    conversationId: string,
    automation: Automation,
  ): boolean {
    const delayInMs = this.parseDelayToMs(automation.triggerValue);

    if (delayInMs === null) {
      return false;
    }

    setTimeout(() => {
      void this.createDelayedAutomatedMessage(
        tenantId,
        conversationId,
        automation.actionValue,
      ).catch(() => undefined);
    }, delayInMs);

    return true;
  }

  private async createDelayedAutomatedMessage(
    tenantId: string,
    conversationId: string,
    content: string,
  ): Promise<void> {
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      return;
    }

    await this.createAutomatedMessage(conversationId, content);
  }

  private parseDelayToMs(triggerValue: string): number | null {
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
}
