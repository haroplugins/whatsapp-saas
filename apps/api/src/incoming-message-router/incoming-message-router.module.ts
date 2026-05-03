import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingAgentModule } from '../booking-agent/booking-agent.module';
import { IncomingMessageRouterController } from './incoming-message-router.controller';
import { IncomingMessageRouterService } from './incoming-message-router.service';

@Module({
  imports: [AuthModule, BookingAgentModule],
  controllers: [IncomingMessageRouterController],
  providers: [IncomingMessageRouterService],
})
export class IncomingMessageRouterModule {}
