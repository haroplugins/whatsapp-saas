import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingAgentService } from './booking-agent.service';
import { ExtractBookingDto } from './dto/extract-booking.dto';
import { ListDryRunLogsDto } from './dto/list-dry-run-logs.dto';
import { ResolveBookingRequestDto } from './dto/resolve-booking-request.dto';
import { SimulateIncomingMessageDto } from './dto/simulate-incoming-message.dto';

@Controller('booking-agent')
@UseGuards(JwtAuthGuard)
export class BookingAgentController {
  constructor(private readonly bookingAgentService: BookingAgentService) {}

  @Post('extract')
  extract(
    @Body() extractBookingDto: ExtractBookingDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.extract(
      currentUser.tenantId,
      extractBookingDto.text,
    );
  }

  @Post('diagnose')
  diagnose(
    @Body() extractBookingDto: ExtractBookingDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.diagnose(
      currentUser.tenantId,
      extractBookingDto.text,
    );
  }

  @Post('orchestrate')
  orchestrate(
    @Body() extractBookingDto: ResolveBookingRequestDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.orchestrate(
      currentUser.tenantId,
      extractBookingDto.text,
    );
  }

  @Post('orchestrate-dry-run')
  orchestrateDryRun(
    @Body() extractBookingDto: ResolveBookingRequestDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.orchestrateDryRun(
      currentUser.tenantId,
      currentUser.userId,
      extractBookingDto.text,
    );
  }

  @Post('simulate-incoming-message')
  simulateIncomingMessage(
    @Body() simulateIncomingMessageDto: SimulateIncomingMessageDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.simulateIncomingMessage(
      currentUser.tenantId,
      currentUser.userId,
      simulateIncomingMessageDto,
    );
  }

  @Get('dry-run-logs')
  listDryRunLogs(
    @Query() query: ListDryRunLogsDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.listDryRunLogs(
      currentUser.tenantId,
      query,
    );
  }

  @Post('conversations/:conversationId/dry-run-latest-message')
  dryRunLatestConversationMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.dryRunLatestConversationMessage(
      currentUser.tenantId,
      currentUser.userId,
      conversationId,
    );
  }

  @Post('resolve')
  resolve(
    @Body() resolveBookingRequestDto: ResolveBookingRequestDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingAgentService.resolve(
      currentUser.tenantId,
      resolveBookingRequestDto.text,
    );
  }
}
