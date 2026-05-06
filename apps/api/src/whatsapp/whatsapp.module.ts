import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessageDeliveryLogService } from './message-delivery-log.service';
import { WhatsappCloudService } from './whatsapp-cloud.service';
import { WhatsappOutboundController } from './whatsapp-outbound.controller';

@Module({
  imports: [AuthModule],
  controllers: [WhatsappOutboundController],
  providers: [MessageDeliveryLogService, WhatsappCloudService],
  exports: [MessageDeliveryLogService, WhatsappCloudService],
})
export class WhatsappModule {}
