import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendaEntitlementGuard } from './agenda-entitlement.guard';
import { AvailabilityRulesService } from './availability-rules.service';
import { UpdateAvailabilityRulesDto } from './dto/update-availability-rules.dto';

@Controller('agenda/availability-rules')
@UseGuards(JwtAuthGuard, AgendaEntitlementGuard)
export class AvailabilityRulesController {
  constructor(
    private readonly availabilityRulesService: AvailabilityRulesService,
  ) {}

  @Get()
  list(@CurrentUser() currentUser: CurrentUserDto) {
    return this.availabilityRulesService.listByTenant(currentUser.tenantId);
  }

  @Put()
  update(
    @Body() updateAvailabilityRulesDto: UpdateAvailabilityRulesDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.availabilityRulesService.replaceForTenant(
      currentUser.tenantId,
      updateAvailabilityRulesDto,
    );
  }
}
