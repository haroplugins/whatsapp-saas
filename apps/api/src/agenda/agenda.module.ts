import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { BlockedSlotsController } from './blocked-slots.controller';
import { BlockedSlotsService } from './blocked-slots.service';
import { BookingSettingsController } from './booking-settings.controller';
import { BookingSettingsService } from './booking-settings.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  controllers: [
    ServicesController,
    AppointmentsController,
    BlockedSlotsController,
    BookingSettingsController,
  ],
  providers: [
    ServicesService,
    AppointmentsService,
    BlockedSlotsService,
    BookingSettingsService,
  ],
})
export class AgendaModule {}
