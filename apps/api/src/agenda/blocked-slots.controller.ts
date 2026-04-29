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
import { BlockedSlotsService } from './blocked-slots.service';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto';
import { UpdateBlockedSlotDto } from './dto/update-blocked-slot.dto';

@Controller('agenda/blocked-slots')
@UseGuards(JwtAuthGuard, AgendaEntitlementGuard)
export class BlockedSlotsController {
  constructor(private readonly blockedSlotsService: BlockedSlotsService) {}

  @Get()
  list(@CurrentUser() currentUser: CurrentUserDto) {
    return this.blockedSlotsService.listByTenant(currentUser.tenantId);
  }

  @Post()
  create(
    @Body() createBlockedSlotDto: CreateBlockedSlotDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.blockedSlotsService.create(
      currentUser.tenantId,
      createBlockedSlotDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') blockedSlotId: string,
    @Body() updateBlockedSlotDto: UpdateBlockedSlotDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.blockedSlotsService.update(
      currentUser.tenantId,
      blockedSlotId,
      updateBlockedSlotDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') blockedSlotId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.blockedSlotsService.remove(currentUser.tenantId, blockedSlotId);
  }
}
