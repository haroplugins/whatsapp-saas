import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('conversations')
  getConversationsSummary(@CurrentUser() currentUser: CurrentUserDto) {
    return this.dashboardService.getConversationsSummary(currentUser.tenantId);
  }

  @Get('messages')
  getMessagesSummary(@CurrentUser() currentUser: CurrentUserDto) {
    return this.dashboardService.getMessagesSummary(currentUser.tenantId);
  }

  @Get('automations')
  getAutomationsSummary(@CurrentUser() currentUser: CurrentUserDto) {
    return this.dashboardService.getAutomationsSummary(currentUser.tenantId);
  }
}
