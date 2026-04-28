import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { IncomingMessagesModule } from '../incoming-messages/incoming-messages.module';
import { MessagesModule } from '../messages/messages.module';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';

@Module({
  imports: [ConversationsModule, IncomingMessagesModule, MessagesModule],
  controllers: [WhatsappWebhookController],
})
export class WebhooksModule {}
