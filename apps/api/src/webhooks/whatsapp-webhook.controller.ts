import { Body, Controller, ForbiddenException, Get, Logger, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
    this.logger.log(`Received WhatsApp webhook event: ${stringifyForLog(body)}`);
    return { ok: true };
  }
}

function stringifyForLog(value: unknown): string {
  const serializedValue = JSON.stringify(value);
  if (!serializedValue) return '{}';
  return serializedValue.length > 2000 ? `${serializedValue.slice(0, 2000)}...` : serializedValue;
}
