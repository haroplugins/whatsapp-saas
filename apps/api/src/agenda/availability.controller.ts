import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendaEntitlementGuard } from './agenda-entitlement.guard';
import { AvailabilityService } from './availability.service';
import { SearchAvailabilityDto } from './dto/search-availability.dto';

@Controller('agenda/availability')
@UseGuards(JwtAuthGuard, AgendaEntitlementGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('search')
  search(
    @Body() searchAvailabilityDto: SearchAvailabilityDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.availabilityService.search(
      currentUser.tenantId,
      searchAvailabilityDto,
    );
  }
}
