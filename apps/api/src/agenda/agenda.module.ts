import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { AgendaEntitlementGuard } from './agenda-entitlement.guard';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityRulesController } from './availability-rules.controller';
import { AvailabilityRulesService } from './availability-rules.service';
import { AvailabilityService } from './availability.service';
import { BlockedSlotsController } from './blocked-slots.controller';
import { BlockedSlotsService } from './blocked-slots.service';
import { BookingSettingsController } from './booking-settings.controller';
import { BookingSettingsService } from './booking-settings.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { SmartBookingSettingsController } from './smart-booking-settings.controller';
import { SmartBookingSettingsService } from './smart-booking-settings.service';

@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [
    ServicesController,
    AppointmentsController,
    BlockedSlotsController,
    BookingSettingsController,
    AvailabilityRulesController,
    AvailabilityController,
    SmartBookingSettingsController,
  ],
  providers: [
    AgendaEntitlementGuard,
    ServicesService,
    AppointmentsService,
    BlockedSlotsService,
    BookingSettingsService,
    AvailabilityRulesService,
    AvailabilityService,
    SmartBookingSettingsService,
  ],
})
export class AgendaModule {}
