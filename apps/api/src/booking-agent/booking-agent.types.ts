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
  deterministicIntent: {
    intent: string;
    confidence: string;
    matchedRule?: string;
    normalizedText: string;
  };
  hasOpenAIKey: boolean;
  wouldCallAI: boolean;
  nextStep: BookingAgentDiagnoseNextStep;
};

export type BookingOrchestratorDecision =
  | 'PLAN_UPGRADE_REQUIRED'
  | 'SMART_BOOKING_DISABLED'
  | 'NO_ACTION_NEEDED'
  | 'AI_FALLBACK_CANDIDATE'
  | 'NEEDS_OPENAI_KEY'
  | 'READY_FOR_EXTRACTION';

export type BookingOrchestratorResult = {
  planAllowed: boolean;
  smartBooking: null | {
    enabled: boolean;
    mode: string;
    maxSuggestions: number;
    missingInfoBehavior: string;
  };
  deterministicIntent: {
    intent: string;
    confidence: string;
    matchedRule?: string;
    normalizedText: string;
  };
  hasOpenAIKey: boolean;
  decision: BookingOrchestratorDecision;
  shouldUseAI: boolean;
  shouldCheckAvailability: boolean;
  shouldCreateAppointment: boolean;
  shouldSendMessage: boolean;
  resolution?: BookingResolutionResult;
};
