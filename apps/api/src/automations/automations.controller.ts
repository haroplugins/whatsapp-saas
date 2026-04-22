import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { ToggleAutomationDto } from './dto/toggle-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { AutomationsService } from './automations.service';

@Controller('automations')
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Post()
  create(
    @Body() createAutomationDto: CreateAutomationDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.automationsService.create(currentUser.tenantId, createAutomationDto);
  }

  @Get()
  list(@CurrentUser() currentUser: CurrentUserDto) {
    return this.automationsService.listByTenant(currentUser.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') automationId: string,
    @Body() updateAutomationDto: UpdateAutomationDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.automationsService.update(
      currentUser.tenantId,
      automationId,
      updateAutomationDto,
    );
  }

  @Patch(':id/toggle')
  toggle(
    @Param('id') automationId: string,
    @Body() toggleAutomationDto: ToggleAutomationDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.automationsService.toggle(
      currentUser.tenantId,
      automationId,
      toggleAutomationDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') automationId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.automationsService.remove(currentUser.tenantId, automationId);
  }
}
