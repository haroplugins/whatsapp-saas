import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessService } from './business.service';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';

@Controller('business/settings')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  getSettings(@CurrentUser() currentUser: CurrentUserDto) {
    return this.businessService.getSettings(currentUser.tenantId);
  }

  @Patch()
  updateSettings(
    @Body() updateBusinessSettingsDto: UpdateBusinessSettingsDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.businessService.updateSettings(
      currentUser.tenantId,
      updateBusinessSettingsDto,
    );
  }
}
