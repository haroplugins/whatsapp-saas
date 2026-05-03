import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ActionType,
  Conversation,
  ConversationDraft,
  ConversationDraftSource,
  ConversationDraftStatus,
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

type UpsertConversationDraftInput = {
  tenantId: string;
  conversationId: string;
  userId: string;
  content: string;
  source?: ConversationDraftSource;
};

type ConversationDraftResponse = {
  draft: ConversationDraft | null;
};

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

  async getDraft(
    tenantId: string,
    conversationId: string,
  ): Promise<ConversationDraftResponse> {
    await this.getById(tenantId, conversationId);

    const draft = await this.prismaService.conversationDraft.findFirst({
      where: {
        tenantId,
        conversationId,
      },
    });

    return {
      draft,
    };
  }

  async upsertDraft(
    input: UpsertConversationDraftInput,
  ): Promise<ConversationDraftResponse> {
    await this.getById(input.tenantId, input.conversationId);

    const draft = await this.prismaService.conversationDraft.upsert({
      where: {
        conversationId: input.conversationId,
      },
      create: {
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        userId: input.userId,
        content: input.content,
        source: input.source ?? ConversationDraftSource.MANUAL,
        status: ConversationDraftStatus.ACTIVE,
      },
      update: {
        userId: input.userId,
        content: input.content,
        source: input.source ?? ConversationDraftSource.MANUAL,
        status: ConversationDraftStatus.ACTIVE,
      },
    });

    return {
      draft,
    };
  }

  async deleteDraft(
    tenantId: string,
    conversationId: string,
  ): Promise<{ ok: true }> {
    await this.getById(tenantId, conversationId);

    await this.prismaService.conversationDraft.deleteMany({
      where: {
        tenantId,
        conversationId,
      },
    });

    return {
      ok: true,
    };
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
