export type IncomingMessageSource = 'whatsapp' | 'manual' | 'system' | 'test';

export type IncomingMessageSender = 'client' | 'user' | 'system' | 'auto';

export type IncomingMessageReplyType =
  | 'NO_REPLY'
  | 'AUTOMATION_REPLY'
  | 'OFF_HOURS_REPLY'
  | 'AI_REPLY'
  | 'HUMAN_REQUIRED';

export type IncomingMessageIntent =
  | 'GREETING'
  | 'BUSINESS_HOURS'
  | 'PRICING'
  | 'BOOKING'
  | 'BOOKING_CHANGE'
  | 'LOCATION'
  | 'ISSUE'
  | 'UNKNOWN';

export type IncomingMessageIntentConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type IncomingMessageIntentClassification = {
  intent: IncomingMessageIntent;
  confidence: IncomingMessageIntentConfidence;
  matchedKeywords: string[];
};

export type HandleIncomingMessageInput = {
  tenantId: string;
  conversationId: string;
  content: string;
  sender: IncomingMessageSender;
  source?: IncomingMessageSource;
};

export type HandleIncomingMessageResult = {
  handled: boolean;
  replyType: IncomingMessageReplyType;
  messageId?: string;
  reason?: string;
  intent?: IncomingMessageIntentClassification;
};
