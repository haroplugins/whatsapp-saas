import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { IntentRouterModule } from '../intent-router/intent-router.module';
import { BookingAgentController } from './booking-agent.controller';
import { BookingAgentService } from './booking-agent.service';
import { BookingResolutionService } from './booking-resolution.service';

@Module({
  imports: [AuthModule, EntitlementsModule, IntentRouterModule, AgendaModule],
  controllers: [BookingAgentController],
  providers: [BookingAgentService, BookingResolutionService],
  exports: [BookingAgentService],
})
export class BookingAgentModule {}
