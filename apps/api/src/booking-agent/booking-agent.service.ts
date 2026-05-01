import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmartBookingSettingsService } from '../agenda/smart-booking-settings.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { IntentRouterService } from '../intent-router/intent-router.service';
import { BookingResolutionService } from './booking-resolution.service';
import type {
  BookingAgentConfidence,
  BookingAgentDiagnoseNextStep,
  BookingAgentDiagnoseResult,
  BookingAgentIntent,
  BookingOrchestratorDecision,
  BookingOrchestratorResult,
  ExtractedBookingIntent,
  TimePreference,
} from './booking-agent.types';
import type { BookingResolutionResult } from './booking-resolution.types';

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const allowedIntents: BookingAgentIntent[] = [
  'BOOKING_REQUEST',
  'BOOKING_CHANGE',
  'BOOKING_CANCEL',
  'PRICE_REQUEST',
  'HOURS_REQUEST',
  'UNKNOWN',
];

const allowedTimePreferences: TimePreference[] = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'ANY',
  'UNKNOWN',
];

const allowedConfidenceValues: BookingAgentConfidence[] = [
  'high',
  'medium',
  'low',
];

@Injectable()
export class BookingAgentService {
  constructor(
    private readonly configService: ConfigService,
    private readonly entitlementsService: EntitlementsService,
    private readonly intentRouterService: IntentRouterService,
    private readonly smartBookingSettingsService: SmartBookingSettingsService,
    private readonly bookingResolutionService: BookingResolutionService,
  ) {}

  async extract(
    tenantId: string,
    text: string,
  ): Promise<ExtractedBookingIntent> {
    const entitlements =
      await this.entitlementsService.getTenantEntitlements(tenantId);

    if (!entitlements.features.canUseSmartBooking) {
      throw new ForbiddenException(
        'La agenda inteligente esta disponible en Premium.',
      );
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      throw new BadRequestException('OPENAI_API_KEY no configurada.');
    }

    const model =
      this.configService.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';
    const content = await this.requestExtraction(apiKey, model, text);

    return parseModelOutput(content, text);
  }

  async diagnose(
    tenantId: string,
    text: string,
  ): Promise<BookingAgentDiagnoseResult> {
    const deterministicIntent = this.intentRouterService.classify(text);
    const entitlements =
      await this.entitlementsService.getTenantEntitlements(tenantId);
    const planAllowed = entitlements.features.canUseSmartBooking;
    const hasOpenAIKey = this.hasOpenAIKey();

    if (!planAllowed) {
      return {
        planAllowed,
        smartBooking: null,
        deterministicIntent,
        hasOpenAIKey,
        wouldCallAI: false,
        nextStep: 'PLAN_UPGRADE_REQUIRED',
      };
    }

    const smartBookingSettings =
      await this.smartBookingSettingsService.get(tenantId);
    const smartBooking = {
      enabled: smartBookingSettings.enabled,
      mode: smartBookingSettings.mode,
      maxSuggestions: smartBookingSettings.maxSuggestions,
      missingInfoBehavior: smartBookingSettings.missingInfoBehavior,
    };

    if (!smartBooking.enabled) {
      return {
        planAllowed,
        smartBooking,
        deterministicIntent,
        hasOpenAIKey,
        wouldCallAI: false,
        nextStep: 'SMART_BOOKING_DISABLED',
      };
    }

    const wouldCallAI = shouldUseBookingAgentExtractor(
      deterministicIntent.intent,
    );

    return {
      planAllowed,
      smartBooking,
      deterministicIntent,
      hasOpenAIKey,
      wouldCallAI,
      nextStep: getDiagnoseNextStep({
        hasOpenAIKey,
        intent: deterministicIntent.intent,
        wouldCallAI,
      }),
    };
  }

  async orchestrate(
    tenantId: string,
    text: string,
  ): Promise<BookingOrchestratorResult> {
    const deterministicIntent = this.intentRouterService.classify(text);
    const entitlements =
      await this.entitlementsService.getTenantEntitlements(tenantId);
    const planAllowed = entitlements.features.canUseSmartBooking;
    const hasOpenAIKey = this.hasOpenAIKey();

    if (!planAllowed) {
      return {
        planAllowed,
        smartBooking: null,
        deterministicIntent,
        hasOpenAIKey,
        decision: 'PLAN_UPGRADE_REQUIRED',
        shouldUseAI: false,
        shouldCheckAvailability: false,
        shouldCreateAppointment: false,
        shouldSendMessage: false,
      };
    }

    const smartBookingSettings =
      await this.smartBookingSettingsService.get(tenantId);
    const smartBooking = {
      enabled: smartBookingSettings.enabled,
      mode: smartBookingSettings.mode,
      maxSuggestions: smartBookingSettings.maxSuggestions,
      missingInfoBehavior: smartBookingSettings.missingInfoBehavior,
    };

    if (!smartBooking.enabled) {
      return {
        planAllowed,
        smartBooking,
        deterministicIntent,
        hasOpenAIKey,
        decision: 'SMART_BOOKING_DISABLED',
        shouldUseAI: false,
        shouldCheckAvailability: false,
        shouldCreateAppointment: false,
        shouldSendMessage: false,
      };
    }

    const shouldUseAI = shouldUseBookingAgentExtractor(
      deterministicIntent.intent,
    );
    const resolution = shouldUseAI
      ? await this.bookingResolutionService.resolve(tenantId, text)
      : undefined;

    return {
      planAllowed,
      smartBooking,
      deterministicIntent,
      hasOpenAIKey,
      decision: getOrchestratorDecision({
        hasOpenAIKey,
        intent: deterministicIntent.intent,
        shouldUseAI,
      }),
      shouldUseAI,
      shouldCheckAvailability: false,
      shouldCreateAppointment: false,
      shouldSendMessage: false,
      ...(resolution ? { resolution } : {}),
    };
  }

  resolve(tenantId: string, text: string): Promise<BookingResolutionResult> {
    return this.bookingResolutionService.resolve(tenantId, text);
  }

  private async requestExtraction(
    apiKey: string,
    model: string,
    text: string,
  ): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 350,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content: bookingAgentSystemPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'No se pudo completar la extraccion con OpenAI.',
      );
    }

    const payload = (await response.json()) as OpenAIChatCompletionResponse;
    return payload.choices?.[0]?.message?.content ?? '';
  }

  private hasOpenAIKey(): boolean {
    return Boolean(this.configService.get<string>('OPENAI_API_KEY')?.trim());
  }
}

const bookingAgentSystemPrompt = `Eres un extractor de intencion para la agenda de un negocio.
Devuelve SOLO JSON valido.
No escribas explicacion.
No escribas markdown.
No inventes datos.
Si no sabes el servicio, serviceQuery debe ser null.
Si no sabes dia o fecha, dateQuery debe ser null.
Si el cliente pide cancelar, intent debe ser BOOKING_CANCEL.
Si quiere cambiar, mover o reprogramar, intent debe ser BOOKING_CHANGE.
Si pide precio, intent debe ser PRICE_REQUEST.
Si pregunta horario, intent debe ser HOURS_REQUEST.
Si pide cita, reserva, hora o hueco, intent debe ser BOOKING_REQUEST.
No propongas horarios.
No confirmes citas.
No escribas respuesta al cliente.
Solo extrae datos.

Campos obligatorios:
intent: BOOKING_REQUEST | BOOKING_CHANGE | BOOKING_CANCEL | PRICE_REQUEST | HOURS_REQUEST | UNKNOWN
serviceQuery: string | null
dateQuery: string | null
timePreference: MORNING | AFTERNOON | EVENING | ANY | UNKNOWN
customerName: string | null
phone: string | null
confidence: high | medium | low
missingFields: string[]
rawText: string

Ejemplo input:
"quiero una manicura el viernes por la tarde"
Ejemplo output:
{
  "intent": "BOOKING_REQUEST",
  "serviceQuery": "manicura",
  "dateQuery": "viernes",
  "timePreference": "AFTERNOON",
  "customerName": null,
  "phone": null,
  "confidence": "high",
  "missingFields": ["customerName"],
  "rawText": "quiero una manicura el viernes por la tarde"
}

Ejemplo input:
"hola, puedo cambiar mi cita de manana?"
Ejemplo output:
{
  "intent": "BOOKING_CHANGE",
  "serviceQuery": null,
  "dateQuery": "manana",
  "timePreference": "UNKNOWN",
  "customerName": null,
  "phone": null,
  "confidence": "high",
  "missingFields": ["customerName"],
  "rawText": "hola, puedo cambiar mi cita de manana?"
}

Ejemplo input:
"cuanto cuesta la pedicura"
Ejemplo output:
{
  "intent": "PRICE_REQUEST",
  "serviceQuery": "pedicura",
  "dateQuery": null,
  "timePreference": "UNKNOWN",
  "customerName": null,
  "phone": null,
  "confidence": "high",
  "missingFields": [],
  "rawText": "cuanto cuesta la pedicura"
}`;

function parseModelOutput(content: string, rawText: string): ExtractedBookingIntent {
  try {
    return normalizeExtraction(JSON.parse(content) as unknown, rawText);
  } catch {
    return buildFallbackExtraction(rawText);
  }
}

function normalizeExtraction(
  value: unknown,
  rawText: string,
): ExtractedBookingIntent {
  if (!isRecord(value)) {
    return buildFallbackExtraction(rawText);
  }

  return {
    intent: normalizeIntent(value.intent),
    serviceQuery: normalizeNullableString(value.serviceQuery),
    dateQuery: normalizeNullableString(value.dateQuery),
    timePreference: normalizeTimePreference(value.timePreference),
    customerName: normalizeNullableString(value.customerName),
    phone: normalizeNullableString(value.phone),
    confidence: normalizeConfidence(value.confidence),
    missingFields: normalizeMissingFields(value.missingFields),
    rawText,
  };
}

function buildFallbackExtraction(rawText: string): ExtractedBookingIntent {
  return {
    intent: 'UNKNOWN',
    serviceQuery: null,
    dateQuery: null,
    timePreference: 'UNKNOWN',
    customerName: null,
    phone: null,
    confidence: 'low',
    missingFields: [],
    rawText,
  };
}

function normalizeIntent(value: unknown): BookingAgentIntent {
  return allowedIntents.includes(value as BookingAgentIntent)
    ? (value as BookingAgentIntent)
    : 'UNKNOWN';
}

function normalizeTimePreference(value: unknown): TimePreference {
  return allowedTimePreferences.includes(value as TimePreference)
    ? (value as TimePreference)
    : 'UNKNOWN';
}

function normalizeConfidence(value: unknown): BookingAgentConfidence {
  return allowedConfidenceValues.includes(value as BookingAgentConfidence)
    ? (value as BookingAgentConfidence)
    : 'low';
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeMissingFields(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shouldUseBookingAgentExtractor(intent: string): boolean {
  return (
    intent === 'BOOKING_REQUEST' ||
    intent === 'BOOKING_CHANGE' ||
    intent === 'BOOKING_CANCEL' ||
    intent === 'PRICE_REQUEST' ||
    intent === 'HOURS_REQUEST' ||
    intent === 'UNKNOWN'
  );
}

function getDiagnoseNextStep(input: {
  hasOpenAIKey: boolean;
  intent: string;
  wouldCallAI: boolean;
}): BookingAgentDiagnoseNextStep {
  if (!input.wouldCallAI) {
    return 'NO_ACTION_NEEDED';
  }

  if (!input.hasOpenAIKey) {
    return 'OPENAI_KEY_REQUIRED';
  }

  if (input.intent === 'UNKNOWN') {
    return 'AI_FALLBACK_CANDIDATE';
  }

  return 'READY_TO_EXTRACT';
}

function getOrchestratorDecision(input: {
  hasOpenAIKey: boolean;
  intent: string;
  shouldUseAI: boolean;
}): BookingOrchestratorDecision {
  if (!input.shouldUseAI) {
    return 'NO_ACTION_NEEDED';
  }

  if (!input.hasOpenAIKey) {
    return 'NEEDS_OPENAI_KEY';
  }

  if (input.intent === 'UNKNOWN') {
    return 'AI_FALLBACK_CANDIDATE';
  }

  return 'READY_FOR_EXTRACTION';
}
