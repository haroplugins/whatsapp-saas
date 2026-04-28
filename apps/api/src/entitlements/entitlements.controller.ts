import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntitlementsService } from './entitlements.service';
import { TenantEntitlementsResponse } from './entitlements.types';

@Controller('tenant/entitlements')
@UseGuards(JwtAuthGuard)
export class EntitlementsController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  @Get()
  getTenantEntitlements(
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<TenantEntitlementsResponse> {
    return this.entitlementsService.getTenantEntitlements(currentUser.tenantId);
  }
}
