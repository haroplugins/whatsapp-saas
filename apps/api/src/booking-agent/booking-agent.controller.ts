import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingAgentService } from './booking-agent.service';
import { ExtractBookingDto } from './dto/extract-booking.dto';

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
}
