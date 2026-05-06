import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WhatsappCloudService } from './whatsapp-cloud.service';
import { WhatsappOutboundController } from './whatsapp-outbound.controller';

@Module({
  imports: [AuthModule],
  controllers: [WhatsappOutboundController],
  providers: [WhatsappCloudService],
  exports: [WhatsappCloudService],
})
export class WhatsappModule {}
