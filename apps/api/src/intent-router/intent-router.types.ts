export type Intent =
  | 'BOOKING_REQUEST'
  | 'BOOKING_CHANGE'
  | 'BOOKING_CANCEL'
  | 'PRICE_REQUEST'
  | 'HOURS_REQUEST'
  | 'UNKNOWN';

export type Confidence = 'high' | 'medium' | 'low';

export type ClassifiedIntent = {
  intent: Intent;
  confidence: Confidence;
  matchedRule?: string;
  normalizedText: string;
};

export type IntentRule = {
  intent: Exclude<Intent, 'UNKNOWN'>;
  key: string;
  phrases: string[];
};
