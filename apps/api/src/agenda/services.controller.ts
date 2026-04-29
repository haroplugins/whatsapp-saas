import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendaEntitlementGuard } from './agenda-entitlement.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@Controller('agenda/services')
@UseGuards(JwtAuthGuard, AgendaEntitlementGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  list(@CurrentUser() currentUser: CurrentUserDto) {
    return this.servicesService.listByTenant(currentUser.tenantId);
  }

  @Post()
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.servicesService.create(currentUser.tenantId, createServiceDto);
  }

  @Patch(':id')
  update(
    @Param('id') serviceId: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.servicesService.update(
      currentUser.tenantId,
      serviceId,
      updateServiceDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') serviceId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.servicesService.remove(currentUser.tenantId, serviceId);
  }
}
