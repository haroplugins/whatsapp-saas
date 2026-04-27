import { Module } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module';
import { IncomingMessageOrchestratorService } from './incoming-message-orchestrator.service';

@Module({
  imports: [MessagesModule],
  providers: [IncomingMessageOrchestratorService],
  exports: [IncomingMessageOrchestratorService],
})
export class IncomingMessagesModule {}
