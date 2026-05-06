import type { MessageSender } from '@prisma/client';

export const WHATSAPP_CLOUD_API_PROVIDER = 'WHATSAPP_CLOUD_API' as const;

export type WhatsappCloudApiProvider = typeof WHATSAPP_CLOUD_API_PROVIDER;

export type WhatsappTextPayload = {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url: false;
    body: string;
  };
};

export type WhatsappSanitizedConfig = {
  apiVersion: string | null;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  outboundEnabled: boolean;
  outboundDryRun: boolean;
  graphBaseUrl: string;
  timeoutMs: number;
  maxTextLength: number;
  allowedTestRecipients: string[];
  isConfigured: boolean;
};

export type WhatsappSendTextInput = {
  to: string;
  text: string;
  correlationId?: string;
  dryRun?: boolean;
};

export type WhatsappSendTextResult =
  | {
      ok: true;
      dryRun: true;
      provider: WhatsappCloudApiProvider;
      externalDelivery: false;
      wouldSendTo: string;
      endpoint: string | null;
      payloadPreview: WhatsappTextPayload;
      config: WhatsappSanitizedConfig;
    }
  | {
      ok: true;
      dryRun: false;
      provider: WhatsappCloudApiProvider;
      externalDelivery: true;
      httpStatus: number;
      wamid: string | null;
      rawResultMinimized: Record<string, unknown>;
    };

export type WhatsappOutboundSendBody = {
  dryRun?: boolean;
  confirmExternalDelivery?: boolean;
};

export type WhatsappOutboundSendResult = {
  ok: true;
  mode: 'whatsapp_outbound_dry_run' | 'whatsapp_outbound_sent';
  conversationId: string;
  messageId: string;
  messageSender: MessageSender;
  externalDelivery: boolean;
  provider: WhatsappCloudApiProvider;
  dryRun: boolean;
  wouldSendTo?: string;
  payloadPreview?: WhatsappTextPayload;
  config?: WhatsappSanitizedConfig;
  httpStatus?: number;
  wamid?: string | null;
  rawResultMinimized?: Record<string, unknown>;
};
