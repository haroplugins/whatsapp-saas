import { Module } from '@nestjs/common';
import { WhatsappCloudService } from './whatsapp-cloud.service';
import { WhatsappOutboundController } from './whatsapp-outbound.controller';

@Module({
  controllers: [WhatsappOutboundController],
  providers: [WhatsappCloudService],
  exports: [WhatsappCloudService],
})
export class WhatsappModule {}
