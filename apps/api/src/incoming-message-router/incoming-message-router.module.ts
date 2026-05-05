import { Module } from '@nestjs/common';
import { AutomaticRepliesModule } from '../automatic-replies/automatic-replies.module';
import { AuthModule } from '../auth/auth.module';
import { BookingAgentModule } from '../booking-agent/booking-agent.module';
import { IncomingMessageRouterController } from './incoming-message-router.controller';
import { IncomingMessageRouterService } from './incoming-message-router.service';

@Module({
  imports: [AuthModule, BookingAgentModule, AutomaticRepliesModule],
  controllers: [IncomingMessageRouterController],
  providers: [IncomingMessageRouterService],
})
export class IncomingMessageRouterModule {}
