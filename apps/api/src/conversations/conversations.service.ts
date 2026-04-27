import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ActionType,
  Conversation,
  ConversationStatus,
  MessageSender,
  TriggerType,
} from '@prisma/client';
import { AutomationsService } from '../automations/automations.service';
import { PrismaService } from '../prisma/prisma.service';

type CreateConversationInput = {
  tenantId: string;
  phone: string;
  name?: string | null;
  status: ConversationStatus;
  isBusiness: boolean;
};

type FindOrCreateWhatsappConversationInput = {
  tenantId: string;
  whatsappFrom: string;
  displayName?: string;
};

type ConversationFilterType = 'business' | 'personal';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly automationsService: AutomationsService,
  ) {}

  create(data: CreateConversationInput): Promise<Conversation> {
    return this.prismaService.conversation.create({
      data,
    });
  }

  async findOrCreateFromWhatsapp(
    input: FindOrCreateWhatsappConversationInput,
  ): Promise<Conversation> {
    const existingConversation = await this.prismaService.conversation.findFirst({
      where: {
        tenantId: input.tenantId,
        phone: input.whatsappFrom,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingConversation) {
      if (!existingConversation.name && input.displayName) {
        return this.prismaService.conversation.update({
          where: {
            id: existingConversation.id,
          },
          data: {
            name: input.displayName,
          },
        });
      }

      return existingConversation;
    }

    // TODO: add first-class WhatsApp external ids/source when the tenant WhatsApp account model exists.
    return this.prismaService.conversation.create({
      data: {
        tenantId: input.tenantId,
        phone: input.whatsappFrom,
        name: input.displayName ?? null,
        status: ConversationStatus.NEW,
        isBusiness: true,
      },
    });
  }

  listByTenant(
    tenantId: string,
    type?: ConversationFilterType,
  ): Promise<Conversation[]> {
    return this.prismaService.conversation.findMany({
      where: {
        tenantId,
        ...(type
          ? {
              isBusiness: type === 'business',
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getById(tenantId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  async updateStatus(
    tenantId: string,
    conversationId: string,
    status: ConversationStatus,
  ): Promise<Conversation> {
    await this.getById(tenantId, conversationId);

    const conversation = await this.prismaService.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        status,
      },
    });

    await this.executeStatusChangeAutomations(tenantId, conversationId, status);

    return conversation;
  }

  async updateBusiness(
    tenantId: string,
    conversationId: string,
    isBusiness: boolean,
  ): Promise<Conversation> {
    await this.getById(tenantId, conversationId);

    return this.prismaService.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        isBusiness,
      },
    });
  }

  private async executeStatusChangeAutomations(
    tenantId: string,
    conversationId: string,
    status: ConversationStatus,
  ): Promise<void> {
    const automations = await this.automationsService.listActiveByTenant(tenantId);

    for (const automation of automations) {
      if (
        automation.triggerType !== TriggerType.STATUS_CHANGE ||
        automation.actionType !== ActionType.SEND_MESSAGE ||
        automation.triggerValue !== status
      ) {
        continue;
      }

      await this.prismaService.message.create({
        data: {
          conversationId,
          sender: MessageSender.USER,
          content: automation.actionValue,
        },
      });
    }
  }
}
