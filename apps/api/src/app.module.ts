import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgendaModule } from './agenda/agenda.module';
import { AutomationsModule } from './automations/automations.module';
import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { IncomingMessagesModule } from './incoming-messages/incoming-messages.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WebhooksModule } from './webhooks/webhooks.module';

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
    EntitlementsModule,
    ConversationsModule,
    MessagesModule,
    IncomingMessagesModule,
    DashboardModule,
    WebhooksModule,
  ],
})
export class AppModule {}
