import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessService } from './business.service';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('settings')
  getSettings(@CurrentUser() currentUser: CurrentUserDto) {
    return this.businessService.getSettings(currentUser.tenantId);
  }

  @Patch('settings')
  updateSettings(
    @Body() updateBusinessSettingsDto: UpdateBusinessSettingsDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.businessService.updateSettings(
      currentUser.tenantId,
      updateBusinessSettingsDto,
    );
  }

  @Get('profile')
  getProfile(@CurrentUser() currentUser: CurrentUserDto) {
    return this.businessService.getProfile(currentUser.tenantId);
  }

  @Patch('profile')
  updateProfile(
    @Body() updateBusinessProfileDto: UpdateBusinessProfileDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.businessService.updateProfile(
      currentUser.tenantId,
      updateBusinessProfileDto,
    );
  }
}
