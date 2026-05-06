import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WHATSAPP_CLOUD_API_PROVIDER,
  type WhatsappSanitizedConfig,
  type WhatsappSendTextInput,
  type WhatsappSendTextResult,
  type WhatsappTextPayload,
} from './whatsapp-cloud.types';

const DEFAULT_GRAPH_BASE_URL = 'https://graph.facebook.com';
const DEFAULT_OUTBOUND_TIMEOUT_MS = 10_000;
const DEFAULT_OUTBOUND_MAX_TEXT_LENGTH = 4096;

@Injectable()
export class WhatsappCloudService {
  constructor(private readonly configService: ConfigService) {}

  getSanitizedConfig(): WhatsappSanitizedConfig {
    const apiVersion = readTrimmedString(this.configService, 'WHATSAPP_API_VERSION');
    const phoneNumberId = readTrimmedString(
      this.configService,
      'WHATSAPP_PHONE_NUMBER_ID',
    );
    const businessAccountId = readTrimmedString(
      this.configService,
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
    );
    const accessToken = readTrimmedString(
      this.configService,
      'WHATSAPP_ACCESS_TOKEN',
    );
    const graphBaseUrl =
      readTrimmedString(this.configService, 'WHATSAPP_GRAPH_BASE_URL') ??
      DEFAULT_GRAPH_BASE_URL;
    const outboundDryRun =
      this.configService.get<string>('WHATSAPP_OUTBOUND_DRY_RUN') !== 'false';
    const timeoutMs = readPositiveIntegerEnv(
      this.configService,
      'WHATSAPP_OUTBOUND_TIMEOUT_MS',
      DEFAULT_OUTBOUND_TIMEOUT_MS,
    );
    const maxTextLength = readPositiveIntegerEnv(
      this.configService,
      'WHATSAPP_OUTBOUND_MAX_TEXT_LENGTH',
      DEFAULT_OUTBOUND_MAX_TEXT_LENGTH,
    );

    return {
      apiVersion,
      phoneNumberId,
      businessAccountId,
      outboundEnabled: readBooleanEnv(
        this.configService,
        'WHATSAPP_OUTBOUND_ENABLED',
      ),
      outboundDryRun,
      graphBaseUrl: normalizeGraphBaseUrl(graphBaseUrl),
      timeoutMs,
      maxTextLength,
      allowedTestRecipients: readAllowedRecipients(this.configService),
      isConfigured: Boolean(apiVersion && phoneNumberId && accessToken),
    };
  }

  isConfigured(): boolean {
    return this.getSanitizedConfig().isConfigured;
  }

  buildTextPayload(input: { to: string; text: string }): WhatsappTextPayload {
    const to = normalizeRecipient(input.to);
    const text = validateText(input.text, this.getSanitizedConfig().maxTextLength);

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };
  }

  async sendText(input: WhatsappSendTextInput): Promise<WhatsappSendTextResult> {
    const config = this.getSanitizedConfig();
    const payload = this.buildTextPayload({
      to: input.to,
      text: input.text,
    });
    const requestedDryRun = input.dryRun ?? config.outboundDryRun;
    const effectiveDryRun = config.outboundDryRun || requestedDryRun !== false;
    const endpoint = buildMessagesEndpoint(config);

    if (effectiveDryRun) {
      return {
        ok: true,
        dryRun: true,
        provider: WHATSAPP_CLOUD_API_PROVIDER,
        externalDelivery: false,
        wouldSendTo: payload.to,
        endpoint,
        payloadPreview: payload,
        config,
      };
    }

    if (!config.outboundEnabled) {
      throw new ServiceUnavailableException(
        'WhatsApp outbound is disabled by configuration.',
      );
    }

    if (!config.isConfigured || !endpoint) {
      throw new ServiceUnavailableException(
        'WhatsApp Cloud API credentials are not configured.',
      );
    }

    if (
      config.allowedTestRecipients.length > 0 &&
      !config.allowedTestRecipients.includes(payload.to)
    ) {
      throw new BadRequestException(
        'Recipient is not allowed by WHATSAPP_ALLOWED_TEST_RECIPIENTS.',
      );
    }

    const accessToken = readTrimmedString(
      this.configService,
      'WHATSAPP_ACCESS_TOKEN',
    );

    if (!accessToken) {
      throw new ServiceUnavailableException(
        'WhatsApp Cloud API credentials are not configured.',
      );
    }

    const response = await postWhatsappText({
      endpoint,
      accessToken,
      payload,
      timeoutMs: config.timeoutMs,
      correlationId: input.correlationId,
    });
    const result = minimizeMetaResult(response.body);

    if (!response.ok) {
      throw new BadGatewayException({
        message: 'WhatsApp Cloud API request failed.',
        httpStatus: response.status,
        error: result.error ?? null,
      });
    }

    return {
      ok: true,
      dryRun: false,
      provider: WHATSAPP_CLOUD_API_PROVIDER,
      externalDelivery: true,
      httpStatus: response.status,
      wamid: extractWamid(response.body),
      rawResultMinimized: result,
    };
  }
}

async function postWhatsappText(input: {
  endpoint: string;
  accessToken: string;
  payload: WhatsappTextPayload;
  timeoutMs: number;
  correlationId?: string;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const response = await fetch(input.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        ...(input.correlationId
          ? {
              'X-Correlation-Id': input.correlationId,
            }
          : {}),
      },
      body: JSON.stringify(input.payload),
      signal: controller.signal,
    });
    const body = await readJsonResponse(response);

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GatewayTimeoutException('WhatsApp Cloud API request timed out.');
    }

    throw new BadGatewayException('WhatsApp Cloud API request failed.');
  } finally {
    clearTimeout(timeout);
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildMessagesEndpoint(config: WhatsappSanitizedConfig): string | null {
  if (!config.apiVersion || !config.phoneNumberId) {
    return null;
  }

  const apiVersion = config.apiVersion.replace(/^\/+/, '').replace(/\/+$/, '');
  const phoneNumberId = config.phoneNumberId
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return `${config.graphBaseUrl}/${apiVersion}/${phoneNumberId}/messages`;
}

function normalizeRecipient(value: string): string {
  const normalized = value.replace(/\D/g, '');

  if (!normalized) {
    throw new BadRequestException('WhatsApp recipient phone is not valid.');
  }

  return normalized;
}

function validateText(text: string, maxTextLength: number): string {
  const normalized = text.trim();

  if (!normalized) {
    throw new BadRequestException('WhatsApp message text cannot be empty.');
  }

  if (normalized.length > maxTextLength) {
    throw new BadRequestException(
      `WhatsApp message text cannot exceed ${maxTextLength} characters.`,
    );
  }

  return normalized;
}

function normalizeGraphBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function readTrimmedString(
  configService: ConfigService,
  key: string,
): string | null {
  const value = configService.get<string>(key)?.trim();
  return value ? value : null;
}

function readBooleanEnv(configService: ConfigService, key: string): boolean {
  return configService.get<string>(key) === 'true';
}

function readPositiveIntegerEnv(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const parsed = Number(configService.get<string>(key));

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function readAllowedRecipients(configService: ConfigService): string[] {
  const value = configService.get<string>('WHATSAPP_ALLOWED_TEST_RECIPIENTS');

  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((recipient) => recipient.replace(/\D/g, ''))
    .filter(Boolean);
}

function minimizeMetaResult(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    return {};
  }

  return {
    messaging_product: body.messaging_product,
    contacts: Array.isArray(body.contacts)
      ? body.contacts.map((contact) =>
          isRecord(contact)
            ? {
                input: contact.input,
                wa_id: contact.wa_id,
              }
            : null,
        )
      : undefined,
    messages: Array.isArray(body.messages)
      ? body.messages.map((message) =>
          isRecord(message)
            ? {
                id: message.id,
              }
            : null,
        )
      : undefined,
    error: isRecord(body.error)
      ? {
          message: body.error.message,
          type: body.error.type,
          code: body.error.code,
          error_subcode: body.error.error_subcode,
          fbtrace_id: body.error.fbtrace_id,
        }
      : undefined,
  };
}

function extractWamid(body: unknown): string | null {
  if (!isRecord(body) || !Array.isArray(body.messages)) {
    return null;
  }

  const firstMessage = body.messages[0];

  if (!isRecord(firstMessage) || typeof firstMessage.id !== 'string') {
    return null;
  }

  return firstMessage.id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
