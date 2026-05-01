import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendaEntitlementGuard } from './agenda-entitlement.guard';
import { UpdateSmartBookingSettingsDto } from './dto/update-smart-booking-settings.dto';
import { SmartBookingSettingsService } from './smart-booking-settings.service';

@Controller('agenda/smart-booking-settings')
@UseGuards(JwtAuthGuard, AgendaEntitlementGuard)
export class SmartBookingSettingsController {
  constructor(
    private readonly smartBookingSettingsService: SmartBookingSettingsService,
  ) {}

  @Get()
  get(@CurrentUser() currentUser: CurrentUserDto) {
    return this.smartBookingSettingsService.get(currentUser.tenantId);
  }

  @Patch()
  update(
    @Body() updateSmartBookingSettingsDto: UpdateSmartBookingSettingsDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.smartBookingSettingsService.update(
      currentUser.tenantId,
      updateSmartBookingSettingsDto,
    );
  }
}
