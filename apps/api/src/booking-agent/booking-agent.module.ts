import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { BookingAgentController } from './booking-agent.controller';
import { BookingAgentService } from './booking-agent.service';

@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [BookingAgentController],
  providers: [BookingAgentService],
  exports: [BookingAgentService],
})
export class BookingAgentModule {}
