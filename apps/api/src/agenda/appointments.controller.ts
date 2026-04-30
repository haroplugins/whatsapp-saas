import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgendaEntitlementGuard } from './agenda-entitlement.guard';
import { AppointmentsService } from './appointments.service';
import { AppointmentsFilterDto } from './dto/appointments-filter.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('agenda/appointments')
@UseGuards(JwtAuthGuard, AgendaEntitlementGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  list(
    @Query() appointmentsFilterDto: AppointmentsFilterDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.appointmentsService.listByTenant(
      currentUser.tenantId,
      appointmentsFilterDto,
    );
  }

  @Post()
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.appointmentsService.create(
      currentUser.tenantId,
      createAppointmentDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') appointmentId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.appointmentsService.update(
      currentUser.tenantId,
      appointmentId,
      updateAppointmentDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') appointmentId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.appointmentsService.remove(currentUser.tenantId, appointmentId);
  }

  @Delete(':id/permanent')
  removePermanently(
    @Param('id') appointmentId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.appointmentsService.removePermanently(
      currentUser.tenantId,
      appointmentId,
    );
  }
}
