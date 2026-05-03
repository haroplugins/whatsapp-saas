import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsFilterDto } from './dto/conversations-filter.dto';
import { UpdateConversationBusinessDto } from './dto/update-conversation-business.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { UpsertConversationDraftDto } from './dto/upsert-conversation-draft.dto';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  list(
    @CurrentUser() currentUser: CurrentUserDto,
    @Query() conversationsFilterDto: ConversationsFilterDto,
  ) {
    return this.conversationsService.listByTenant(
      currentUser.tenantId,
      conversationsFilterDto.type,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') conversationId: string,
    @Body() updateConversationStatusDto: UpdateConversationStatusDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.conversationsService.updateStatus(
      currentUser.tenantId,
      conversationId,
      updateConversationStatusDto.status,
    );
  }

  @Patch(':id/business')
  updateBusiness(
    @Param('id') conversationId: string,
    @Body() updateConversationBusinessDto: UpdateConversationBusinessDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.conversationsService.updateBusiness(
      currentUser.tenantId,
      conversationId,
      updateConversationBusinessDto.isBusiness,
    );
  }

  @Get(':id/draft')
  getDraft(
    @Param('id') conversationId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.conversationsService.getDraft(
      currentUser.tenantId,
      conversationId,
    );
  }

  @Put(':id/draft')
  upsertDraft(
    @Param('id') conversationId: string,
    @Body() upsertConversationDraftDto: UpsertConversationDraftDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.conversationsService.upsertDraft({
      tenantId: currentUser.tenantId,
      conversationId,
      userId: currentUser.userId,
      content: upsertConversationDraftDto.content,
      source: upsertConversationDraftDto.source,
    });
  }

  @Delete(':id/draft')
  deleteDraft(
    @Param('id') conversationId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.conversationsService.deleteDraft(
      currentUser.tenantId,
      conversationId,
    );
  }
}
