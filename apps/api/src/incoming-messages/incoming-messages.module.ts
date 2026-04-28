import { Module } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module';
import { IncomingIntentClassifierService } from './incoming-intent-classifier.service';
import { IncomingMessageOrchestratorService } from './incoming-message-orchestrator.service';

@Module({
  imports: [MessagesModule],
  providers: [IncomingIntentClassifierService, IncomingMessageOrchestratorService],
  exports: [IncomingIntentClassifierService, IncomingMessageOrchestratorService],
})
export class IncomingMessagesModule {}
