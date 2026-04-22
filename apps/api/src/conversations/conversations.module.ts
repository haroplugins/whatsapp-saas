import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AutomationsModule } from '../automations/automations.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [AuthModule, AutomationsModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
