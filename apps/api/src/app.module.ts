import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationsModule } from './automations/automations.module';
import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

const rootEnvPath = resolve(process.cwd(), '.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: existsSync(rootEnvPath) ? rootEnvPath : undefined,
    }),
    PrismaModule,
    AutomationsModule,
    UsersModule,
    AuthModule,
    ConversationsModule,
    MessagesModule,
    DashboardModule,
  ],
})
export class AppModule {}
