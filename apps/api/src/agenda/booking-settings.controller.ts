import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingSettingsService } from './booking-settings.service';
import { UpdateBookingSettingsDto } from './dto/update-booking-settings.dto';

@Controller('agenda/settings')
@UseGuards(JwtAuthGuard)
export class BookingSettingsController {
  constructor(
    private readonly bookingSettingsService: BookingSettingsService,
  ) {}

  @Get()
  get(@CurrentUser() currentUser: CurrentUserDto) {
    return this.bookingSettingsService.getOrCreate(currentUser.tenantId);
  }

  @Put()
  update(
    @Body() updateBookingSettingsDto: UpdateBookingSettingsDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.bookingSettingsService.update(
      currentUser.tenantId,
      updateBookingSettingsDto,
    );
  }
}
