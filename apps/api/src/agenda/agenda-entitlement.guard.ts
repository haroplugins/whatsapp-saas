import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class AgendaEntitlementGuard implements CanActivate {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: CurrentUserDto }>();

    if (!request.user) {
      throw new ForbiddenException('Agenda is not available for this tenant.');
    }

    const entitlements = await this.entitlementsService.getTenantEntitlements(
      request.user.tenantId,
    );

    if (
      !entitlements.features.canUseAgenda ||
      !entitlements.features.canUseManualAgenda
    ) {
      throw new ForbiddenException('Agenda is available in plan Pro.');
    }

    return true;
  }
}
