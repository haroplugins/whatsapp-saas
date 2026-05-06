import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgendaModule } from './agenda/agenda.module';
import { AutomationsModule } from './automations/automations.module';
import { AuthModule } from './auth/auth.module';
import { BookingAgentModule } from './booking-agent/booking-agent.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { IncomingMessageRouterModule } from './incoming-message-router/incoming-message-router.module';
import { IncomingMessagesModule } from './incoming-messages/incoming-messages.module';
import { IntentRouterModule } from './intent-router/intent-router.module';
import { MessagesModule } from './messages/messages.module';
import { DataRetentionService } from './privacy/data-retention.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

const rootEnvPath = resolve(process.cwd(), '.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: existsSync(rootEnvPath) ? rootEnvPath : undefined,
    }),
    PrismaModule,
    AgendaModule,
    AutomationsModule,
    UsersModule,
    AuthModule,
    BookingAgentModule,
    EntitlementsModule,
    ConversationsModule,
    MessagesModule,
    IncomingMessageRouterModule,
    IncomingMessagesModule,
    IntentRouterModule,
    DashboardModule,
    WebhooksModule,
    WhatsappModule,
  ],
  providers: [DataRetentionService],
})
export class AppModule {}
