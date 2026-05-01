import type { ClassifiedIntent } from '../intent-router/intent-router.types';
import type { BookingResolutionResult } from './booking-resolution.types';

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
