import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AvailabilityService } from '../agenda/availability.service';
import { SmartBookingSettingsService } from '../agenda/smart-booking-settings.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { IntentRouterService } from '../intent-router/intent-router.service';
import type { ClassifiedIntent } from '../intent-router/intent-router.types';
import { BookingResolutionService } from './booking-resolution.service';
import type {
  BookingAgentConfidence,
  BookingAgentDiagnoseNextStep,
  BookingAgentDiagnoseResult,
  BookingAgentIntent,
  BookingAvailabilityPreview,
  BookingAvailabilityPreviewSlot,
  BookingOrchestratorDecision,
  BookingOrchestratorResult,
  BookingSuggestedReply,
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
    private readonly availabilityService: AvailabilityService,
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
      return buildOrchestratorResult({
        planAllowed,
        smartBooking: null,
        deterministicIntent,
        hasOpenAIKey,
        decision: 'PLAN_UPGRADE_REQUIRED',
        nextAction: 'PLAN_UPGRADE_REQUIRED',
        shouldUseAI: false,
        shouldCheckAvailability: false,
        shouldCreateAppointment: false,
        shouldSendMessage: false,
        availabilityPreview: {
          checked: false,
          reason: 'NOT_ALLOWED',
        },
      });
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
      return buildOrchestratorResult({
        planAllowed,
        smartBooking,
        deterministicIntent,
        hasOpenAIKey,
        decision: 'SMART_BOOKING_DISABLED',
        nextAction: 'SMART_BOOKING_DISABLED',
        shouldUseAI: false,
        shouldCheckAvailability: false,
        shouldCreateAppointment: false,
        shouldSendMessage: false,
        availabilityPreview: {
          checked: false,
          reason: 'SMART_BOOKING_DISABLED',
        },
      });
    }

    const routeDecision = getNonBookingIntentDecision(deterministicIntent);

    if (routeDecision) {
      return buildOrchestratorResult({
        planAllowed,
        smartBooking,
        deterministicIntent,
        hasOpenAIKey,
        decision: routeDecision,
        nextAction: routeDecision,
        shouldUseAI: false,
        shouldCheckAvailability: false,
        shouldCreateAppointment: false,
        shouldSendMessage: false,
        availabilityPreview: {
          checked: false,
          reason: 'NOT_BOOKING_INTENT',
        },
      });
    }

    const resolution = await this.bookingResolutionService.resolve(tenantId, text);
    const decision = resolution.readyForAvailabilitySearch
      ? 'READY_TO_CHECK_AVAILABILITY_LATER'
      : 'NEEDS_MORE_BOOKING_INFO';
    const availabilityPreview = resolution.readyForAvailabilitySearch
      ? await this.buildAvailabilityPreview({
          tenantId,
          resolution,
          maxSuggestions: smartBooking.maxSuggestions,
        })
      : {
          checked: false,
          reason: 'NOT_READY',
        } satisfies BookingAvailabilityPreview;

    return buildOrchestratorResult({
      planAllowed,
      smartBooking,
      deterministicIntent,
      hasOpenAIKey,
      decision,
      nextAction: decision,
      shouldUseAI: false,
      shouldCheckAvailability: false,
      shouldCreateAppointment: false,
      shouldSendMessage: false,
      resolution,
      availabilityPreview,
    });
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

  private async buildAvailabilityPreview({
    tenantId,
    resolution,
    maxSuggestions,
  }: {
    tenantId: string;
    resolution: BookingResolutionResult;
    maxSuggestions: number;
  }): Promise<BookingAvailabilityPreview> {
    if (
      resolution.serviceResolution.status !== 'MATCHED' ||
      resolution.dateResolution.status !== 'RESOLVED'
    ) {
      return {
        checked: false,
        reason: 'NOT_READY',
      };
    }

    const availability = await this.availabilityService.search(tenantId, {
      serviceId: resolution.serviceResolution.serviceId,
      date: resolution.dateResolution.date,
      stepMinutes: 15,
    });
    const timePreference =
      resolution.timePreference.status === 'RESOLVED'
        ? resolution.timePreference.value
        : 'UNKNOWN';
    const slots = availability.slots.map((slot) => ({
      startAt: slot.startAt,
      endAt: slot.endAt,
      occupiedUntil: slot.occupiedUntil,
      label: slot.label,
    }));
    const filteredSlots = filterSlotsByTimePreference(
      slots,
      timePreference,
    );
    const suggestionLimit = normalizeMaxSuggestions(maxSuggestions);
    const suggestedSlots = filteredSlots.slice(0, suggestionLimit);

    return {
      checked: true,
      source: 'agenda.availability.search',
      date: availability.date,
      serviceId: availability.service.id,
      serviceName: availability.service.name,
      timePreference,
      totalSlots: slots.length,
      filteredSlots,
      suggestedSlots,
      hasAvailability: suggestedSlots.length > 0,
    };
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

function getNonBookingIntentDecision(
  deterministicIntent: ClassifiedIntent,
): BookingOrchestratorDecision | null {
  if (deterministicIntent.intent === 'PRICE_REQUEST') {
    return 'ROUTE_TO_PRICE_FLOW_LATER';
  }

  if (deterministicIntent.intent === 'HOURS_REQUEST') {
    return 'ROUTE_TO_HOURS_FLOW_LATER';
  }

  if (deterministicIntent.intent === 'UNKNOWN') {
    return 'NO_ACTION_NEEDED';
  }

  return null;
}

function buildOrchestratorResult(input: Omit<
  BookingOrchestratorResult,
  | 'schemaVersion'
  | 'permissions'
  | 'intent'
  | 'readiness'
  | 'execution'
  | 'suggestedReply'
>): BookingOrchestratorResult {
  return {
    schemaVersion: 'booking-orchestrator.v1',
    ...input,
    permissions: buildOrchestratorPermissions(input),
    intent: buildOrchestratorIntent(input.deterministicIntent),
    readiness: buildOrchestratorReadiness(input.resolution),
    execution: buildOrchestratorExecution(input),
    suggestedReply: buildSuggestedReply(input),
  };
}

function buildOrchestratorPermissions(input: Pick<
  BookingOrchestratorResult,
  'planAllowed' | 'smartBooking'
>): BookingOrchestratorResult['permissions'] {
  return {
    planAllowed: input.planAllowed,
    smartBookingEnabled: input.smartBooking?.enabled ?? false,
    smartBookingMode: input.smartBooking?.mode ?? null,
  };
}

function buildOrchestratorIntent(
  deterministicIntent: ClassifiedIntent,
): BookingOrchestratorResult['intent'] {
  return {
    type: deterministicIntent.intent,
    confidence: deterministicIntent.confidence,
    ...(deterministicIntent.matchedRule
      ? { matchedRule: deterministicIntent.matchedRule }
      : {}),
    normalizedText: deterministicIntent.normalizedText,
  };
}

function buildOrchestratorReadiness(
  resolution: BookingResolutionResult | undefined,
): BookingOrchestratorResult['readiness'] {
  return {
    readyForAvailabilitySearch:
      resolution?.readyForAvailabilitySearch ?? false,
    missingFields: resolution?.missingFields ?? [],
  };
}

function buildOrchestratorExecution(input: Pick<
  BookingOrchestratorResult,
  | 'shouldUseAI'
  | 'shouldCheckAvailability'
  | 'shouldCreateAppointment'
  | 'shouldSendMessage'
>): BookingOrchestratorResult['execution'] {
  return {
    shouldUseAI: input.shouldUseAI,
    shouldCheckAvailability: input.shouldCheckAvailability,
    shouldCreateAppointment: input.shouldCreateAppointment,
    shouldSendMessage: input.shouldSendMessage,
  };
}

function buildSuggestedReply(input: Pick<
  BookingOrchestratorResult,
  | 'availabilityPreview'
  | 'deterministicIntent'
  | 'resolution'
  | 'smartBooking'
>): BookingSuggestedReply {
  if (!input.smartBooking) {
    return {
      prepared: false,
      reason: 'NOT_ALLOWED',
    };
  }

  if (!input.smartBooking.enabled) {
    return {
      prepared: false,
      reason: 'SMART_BOOKING_DISABLED',
    };
  }

  if (
    input.deterministicIntent.intent !== 'BOOKING_REQUEST' &&
    input.deterministicIntent.intent !== 'BOOKING_CHANGE' &&
    input.deterministicIntent.intent !== 'BOOKING_CANCEL'
  ) {
    return {
      prepared: false,
      reason: 'NOT_BOOKING_INTENT',
    };
  }

  const serviceStatus = input.resolution?.serviceResolution.status;
  const dateStatus = input.resolution?.dateResolution.status;

  if (
    !input.resolution ||
    serviceStatus === 'MISSING' ||
    serviceStatus === 'NOT_FOUND' ||
    serviceStatus === 'MULTIPLE_MATCHES'
  ) {
    return {
      prepared: true,
      reason: 'MISSING_SERVICE',
      text: '¿Para qué servicio quieres reservar?',
    };
  }

  if (dateStatus !== 'RESOLVED') {
    return {
      prepared: true,
      reason: 'MISSING_DATE',
      text: '¿Qué día te iría bien para la cita?',
    };
  }

  if (
    input.resolution.serviceResolution.status !== 'MATCHED' ||
    input.resolution.dateResolution.status !== 'RESOLVED'
  ) {
    return {
      prepared: true,
      reason: 'MISSING_INFO',
      text: 'Necesito algún dato más para poder buscar huecos.',
    };
  }

  if (!input.availabilityPreview.checked) {
    return {
      prepared: true,
      reason: 'MISSING_INFO',
      text: 'Necesito algún dato más para poder buscar huecos.',
    };
  }

  if (!input.availabilityPreview.hasAvailability) {
    return {
      prepared: true,
      reason: 'NO_SLOTS_AVAILABLE',
      text: `No tengo disponibilidad para ${input.availabilityPreview.serviceName} en ese día/franja. ¿Quieres que busque otro día?`,
    };
  }

  return {
    prepared: true,
    reason: 'SLOTS_AVAILABLE',
    text: buildSlotsAvailableReply(input.resolution, input.availabilityPreview),
  };
}

function buildSlotsAvailableReply(
  resolution: BookingResolutionResult,
  availabilityPreview: Extract<
    BookingAvailabilityPreview,
    { checked: true }
  >,
): string {
  const dateLabel =
    resolution.dateResolution.status === 'RESOLVED'
      ? resolution.dateResolution.source || resolution.dateResolution.date
      : availabilityPreview.date;
  const timeLabel = getTimePreferenceLabel(availabilityPreview.timePreference);
  const header = [
    `Tengo disponibilidad para ${availabilityPreview.serviceName} el ${dateLabel}`,
    timeLabel,
  ]
    .filter(Boolean)
    .join(' ');
  const slots = availabilityPreview.suggestedSlots
    .map((slot) => `- ${slot.label}`)
    .join('\n');

  return `${header}:\n${slots}\n\n¿Te va bien alguna de estas horas?`;
}

function getTimePreferenceLabel(timePreference: string): string {
  if (timePreference === 'MORNING') {
    return 'por la mañana';
  }

  if (timePreference === 'AFTERNOON') {
    return 'por la tarde';
  }

  if (timePreference === 'EVENING') {
    return 'por la noche';
  }

  return '';
}

function filterSlotsByTimePreference(
  slots: BookingAvailabilityPreviewSlot[],
  timePreference: string,
): BookingAvailabilityPreviewSlot[] {
  if (
    timePreference === 'ANY' ||
    timePreference === 'UNKNOWN' ||
    !timePreference
  ) {
    return slots;
  }

  return slots.filter((slot) => isSlotInTimePreference(slot.label, timePreference));
}

function isSlotInTimePreference(label: string, timePreference: string): boolean {
  const minutes = parseSlotLabelMinutes(label);

  if (minutes === null) {
    return false;
  }

  if (timePreference === 'MORNING') {
    return minutes >= 6 * 60 && minutes < 14 * 60;
  }

  if (timePreference === 'AFTERNOON') {
    return minutes >= 15 * 60 && minutes < 21 * 60;
  }

  if (timePreference === 'EVENING') {
    return minutes >= 19 * 60 && minutes < 24 * 60;
  }

  return true;
}

function parseSlotLabelMinutes(label: string): number | null {
  const match = label.match(/^(\d{1,2}):(\d{2})$/u);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function normalizeMaxSuggestions(value: number): number {
  if (!Number.isInteger(value)) {
    return 3;
  }

  if (value < 1) {
    return 3;
  }

  if (value > 10) {
    return 10;
  }

  return value;
}
