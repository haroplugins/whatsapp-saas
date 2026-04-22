import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MessageSender } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsService } from '../conversations/conversations.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get(':id/messages')
  async list(
    @Param('id') conversationId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    const conversation = await this.conversationsService.getById(
      currentUser.tenantId,
      conversationId,
    );

    return this.messagesService.listByConversation(conversation.id);
  }

  @Post(':id/messages')
  async create(
    @Param('id') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    const conversation = await this.conversationsService.getById(
      currentUser.tenantId,
      conversationId,
    );

    return this.messagesService.create({
      conversationId: conversation.id,
      sender: MessageSender.USER,
      content: createMessageDto.content,
    });
  }
}
