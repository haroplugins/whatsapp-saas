import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { AgendaEntitlementGuard } from './agenda-entitlement.guard';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AvailabilityRulesController } from './availability-rules.controller';
import { AvailabilityRulesService } from './availability-rules.service';
import { BlockedSlotsController } from './blocked-slots.controller';
import { BlockedSlotsService } from './blocked-slots.service';
import { BookingSettingsController } from './booking-settings.controller';
import { BookingSettingsService } from './booking-settings.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [
    ServicesController,
    AppointmentsController,
    BlockedSlotsController,
    BookingSettingsController,
    AvailabilityRulesController,
  ],
  providers: [
    AgendaEntitlementGuard,
    ServicesService,
    AppointmentsService,
    BlockedSlotsService,
    BookingSettingsService,
    AvailabilityRulesService,
  ],
})
export class AgendaModule {}
