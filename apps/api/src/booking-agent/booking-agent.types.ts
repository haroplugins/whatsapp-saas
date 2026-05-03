import type { ClassifiedIntent } from '../intent-router/intent-router.types';
import type {
  BookingResolutionResult,
  TimePreferenceValue,
} from './booking-resolution.types';

export type BookingAgentIntent =
  | 'BOOKING_REQUEST'
  | 'BOOKING_CHANGE'
  | 'BOOKING_CANCEL'
  | 'PRICE_REQUEST'
  | 'HOURS_REQUEST'
  | 'UNKNOWN';

export type TimePreference =
  | 'MORNING'
  | 'AFTERNOON'
  | 'EVENING'
  | 'ANY'
  | 'UNKNOWN';

export type BookingAgentConfidence = 'high' | 'medium' | 'low';

export type ExtractedBookingIntent = {
  intent: BookingAgentIntent;
  serviceQuery: string | null;
  dateQuery: string | null;
  timePreference: TimePreference;
  customerName: string | null;
  phone: string | null;
  confidence: BookingAgentConfidence;
  missingFields: string[];
  rawText: string;
};

export type BookingAgentDiagnoseNextStep =
  | 'PLAN_UPGRADE_REQUIRED'
  | 'SMART_BOOKING_DISABLED'
  | 'NO_ACTION_NEEDED'
  | 'AI_FALLBACK_CANDIDATE'
  | 'OPENAI_KEY_REQUIRED'
  | 'READY_TO_EXTRACT';

export type BookingAgentDiagnoseResult = {
  planAllowed: boolean;
  smartBooking: null | {
    enabled: boolean;
    mode: string;
    maxSuggestions: number;
    missingInfoBehavior: string;
  };
  deterministicIntent: ClassifiedIntent;
  hasOpenAIKey: boolean;
  wouldCallAI: boolean;
  nextStep: BookingAgentDiagnoseNextStep;
};

export type BookingOrchestratorDecision =
  | 'PLAN_UPGRADE_REQUIRED'
  | 'SMART_BOOKING_DISABLED'
  | 'NO_ACTION_NEEDED'
  | 'ROUTE_TO_PRICE_FLOW_LATER'
  | 'ROUTE_TO_HOURS_FLOW_LATER'
  | 'READY_TO_RESOLVE_BOOKING'
  | 'READY_TO_CHECK_AVAILABILITY_LATER'
  | 'NEEDS_MORE_BOOKING_INFO'
  | 'AI_FALLBACK_CANDIDATE'
  | 'NEEDS_OPENAI_KEY'
  | 'READY_FOR_EXTRACTION';

export type BookingOrchestratorResult = {
  schemaVersion: 'booking-orchestrator.v1';
  planAllowed: boolean;
  smartBooking: null | {
    enabled: boolean;
    mode: string;
    maxSuggestions: number;
    missingInfoBehavior: string;
  };
  deterministicIntent: ClassifiedIntent;
  hasOpenAIKey: boolean;
  decision: BookingOrchestratorDecision;
  nextAction: BookingOrchestratorDecision;
  shouldUseAI: boolean;
  shouldCheckAvailability: boolean;
  shouldCreateAppointment: boolean;
  shouldSendMessage: boolean;
  resolution?: BookingResolutionResult;
  availabilityPreview: BookingAvailabilityPreview;
  suggestedReply: BookingSuggestedReply;
  permissions: {
    planAllowed: boolean;
    smartBookingEnabled: boolean;
    smartBookingMode: string | null;
  };
  intent: {
    type: ClassifiedIntent['intent'];
    confidence: ClassifiedIntent['confidence'];
    matchedRule?: string;
    normalizedText: string;
  };
  readiness: {
    readyForAvailabilitySearch: boolean;
    missingFields: string[];
  };
  execution: {
    shouldUseAI: boolean;
    shouldCheckAvailability: boolean;
    shouldCreateAppointment: boolean;
    shouldSendMessage: boolean;
  };
};

export type BookingAgentSimulationResult = {
  ok: true;
  mode: 'dry_run';
  source: string;
  input: {
    text: string;
    conversationId?: string;
    customerPhone?: string;
    customerName?: string;
  };
  orchestrator: BookingOrchestratorResult;
  would: {
    sendMessage: false;
    createAppointment: false;
    useOpenAI: false;
    suggestedReplyText: string | null;
  };
};

export type BookingAgentConversationDryRunResult = {
  ok: true;
  mode: 'dry_run';
  source: 'conversation_latest_message';
  conversationId: string;
  messageId: string;
  input: {
    text: string;
    conversationId: string;
  };
  orchestrator: BookingOrchestratorResult;
  would: {
    sendMessage: false;
    createAppointment: false;
    useOpenAI: false;
    suggestedReplyText: string | null;
  };
};

export type BookingAgentDryRunLogListItem = {
  id: string;
  createdAt: string;
  inputText: string;
  intent: string | null;
  decision: string | null;
  nextAction: string | null;
  suggestedReplyPrepared: boolean;
  suggestedReplyReason: string | null;
  suggestedReplyText: string | null;
  hasAvailability: boolean | null;
  availabilityChecked: boolean;
  serviceName: string | null;
  serviceId: string | null;
  date: string | null;
  timePreference: string | null;
};

export type BookingAgentDryRunLogsResult = {
  items: BookingAgentDryRunLogListItem[];
  meta: {
    limit: number;
    count: number;
  };
};

export type BookingSuggestedReplyReason =
  | 'SLOTS_AVAILABLE'
  | 'NO_SLOTS_AVAILABLE'
  | 'MISSING_SERVICE'
  | 'MISSING_DATE'
  | 'MISSING_INFO'
  | 'NOT_BOOKING_INTENT'
  | 'NOT_ALLOWED'
  | 'SMART_BOOKING_DISABLED';

export type BookingSuggestedReply =
  | {
      prepared: false;
      reason:
        | 'NOT_BOOKING_INTENT'
        | 'NOT_ALLOWED'
        | 'SMART_BOOKING_DISABLED';
    }
  | {
      prepared: true;
      reason: Exclude<
        BookingSuggestedReplyReason,
        'NOT_BOOKING_INTENT' | 'NOT_ALLOWED' | 'SMART_BOOKING_DISABLED'
      >;
      text: string;
    };

export type BookingAvailabilityPreviewSlot = {
  startAt: string;
  endAt: string;
  occupiedUntil: string;
  label: string;
};

export type BookingAvailabilityPreview =
  | {
      checked: false;
      reason:
        | 'NOT_ALLOWED'
        | 'SMART_BOOKING_DISABLED'
        | 'NOT_BOOKING_INTENT'
        | 'NOT_READY';
    }
  | {
      checked: true;
      source: 'agenda.availability.search';
      date: string;
      serviceId: string;
      serviceName: string;
      timePreference: TimePreferenceValue;
      totalSlots: number;
      filteredSlots: BookingAvailabilityPreviewSlot[];
      suggestedSlots: BookingAvailabilityPreviewSlot[];
      hasAvailability: boolean;
    };
