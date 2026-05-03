import { Injectable } from '@nestjs/common';
import { MessageSender } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getConversationsSummary(tenantId: string) {
    const [total, totalBusiness, totalPersonal] = await Promise.all([
      this.prismaService.conversation.count({
        where: {
          tenantId,
        },
      }),
      this.prismaService.conversation.count({
        where: {
          tenantId,
          isBusiness: true,
        },
      }),
      this.prismaService.conversation.count({
        where: {
          tenantId,
          isBusiness: false,
        },
      }),
    ]);

    return {
      total,
      totalBusiness,
      totalPersonal,
    };
  }

  async getMessagesSummary(tenantId: string) {
    const conversationFilter = {
      conversation: {
        tenantId,
      },
    };

    const [total, sentByUser, sentByClient, sentByAi] = await Promise.all([
      this.prismaService.message.count({
        where: conversationFilter,
      }),
      this.prismaService.message.count({
        where: {
          ...conversationFilter,
          sender: MessageSender.USER,
        },
      }),
      this.prismaService.message.count({
        where: {
          ...conversationFilter,
          sender: MessageSender.CLIENT,
        },
      }),
      this.prismaService.message.count({
        where: {
          ...conversationFilter,
          sender: MessageSender.AI,
        },
      }),
    ]);

    return {
      total,
      sentByUser,
      sentByClient,
      sentByAi,
    };
  }

  async getAutomationsSummary(tenantId: string) {
    const [total, active, inactive] = await Promise.all([
      this.prismaService.automation.count({
        where: {
          tenantId,
        },
      }),
      this.prismaService.automation.count({
        where: {
          tenantId,
          isActive: true,
        },
      }),
      this.prismaService.automation.count({
        where: {
          tenantId,
          isActive: false,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}
