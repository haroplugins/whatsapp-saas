import {
  BadRequestException,
  Body,
  Controller,
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
import { WhatsappCloudService } from './whatsapp-cloud.service';
import {
  type WhatsappOutboundSendBody,
  type WhatsappOutboundSendResult,
} from './whatsapp-cloud.types';

@Controller('whatsapp/outbound')
@UseGuards(JwtAuthGuard)
export class WhatsappOutboundController {
  constructor(
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
      throw new BadRequestException(
        'External WhatsApp delivery requires confirmExternalDelivery=true.',
      );
    }

    const sendResult = await this.whatsappCloudService.sendText({
      to: conversation.phone,
      text: message.content,
      correlationId: message.id,
      dryRun: effectiveDryRun,
    });

    if (sendResult.dryRun) {
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
      };
    }

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
    };
  }
}
