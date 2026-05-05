import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IncomingMessageRouterService } from './incoming-message-router.service';

@Controller('incoming-message-router')
@UseGuards(JwtAuthGuard)
export class IncomingMessageRouterController {
  constructor(
    private readonly incomingMessageRouterService: IncomingMessageRouterService,
  ) {}

  @Post('conversations/:conversationId/messages/:messageId/dry-run')
  dryRunIncomingReply(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.incomingMessageRouterService.dryRunIncomingReply(
      currentUser.tenantId,
      conversationId,
      messageId,
    );
  }

  @Post('conversations/:conversationId/messages/:messageId/internal-send')
  internalSendIncomingReply(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.incomingMessageRouterService.internalSendIncomingReply(
      currentUser.tenantId,
      conversationId,
      messageId,
    );
  }
}
