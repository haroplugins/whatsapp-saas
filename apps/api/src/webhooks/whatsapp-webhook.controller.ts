import { Body, Controller, ForbiddenException, Get, Logger, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseWhatsappWebhookPayload } from './whatsapp-parser';

type WhatsappWebhookVerificationQuery = {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
};

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly configService: ConfigService) {}

  @Get()
  verify(@Query() query: WhatsappWebhookVerificationQuery): string {
    const expectedVerifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (expectedVerifyToken && query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === expectedVerifyToken) {
      return query['hub.challenge'] ?? '';
    }

    throw new ForbiddenException('Invalid WhatsApp webhook verification token');
  }

  @Post()
  receive(@Body() body: unknown): { ok: true } {
    const parsedMessages = parseWhatsappWebhookPayload(body);
    this.logger.log(`Parsed WhatsApp webhook messages: ${JSON.stringify({
      count: parsedMessages.length,
      messages: parsedMessages.map((message) => ({
        from: message.from,
        type: message.type,
      })),
    })}`);
    return { ok: true };
  }
}
