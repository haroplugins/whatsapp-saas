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
