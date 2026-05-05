import type { ConversationControlMode } from '@prisma/client';
import type { AutomaticReplySendPolicy } from '../automatic-replies/automatic-reply-policy.types';

export type IncomingMessageReplyCandidateSource =
  | 'CLASSIC_AUTOMATION'
  | 'BOOKING_ADVISOR';

export type IncomingMessageReplyCandidateReason =
  | 'KEYWORD_MATCH'
  | 'TIME_DELAY_MATCH'
  | 'BOOKING_REQUEST'
  | 'BOOKING_CHANGE'
  | 'BOOKING_CANCEL'
  | 'PRICE_REQUEST'
  | 'HOURS_REQUEST'
  | 'UNKNOWN';

export type IncomingMessageReplyDecisionType =
  | 'NO_REPLY'
  | 'BLOCKED_BY_CONTROL_MODE'
  | 'CLASSIC_AUTOMATION_WOULD_REPLY'
  | 'BOOKING_ADVISOR_WOULD_REPLY'
  | 'CONFLICT_MULTIPLE_REPLIES';

export type IncomingMessageReplyCandidate = {
  source: IncomingMessageReplyCandidateSource;
  wouldReply: true;
  reason: IncomingMessageReplyCandidateReason;
  replyTextPreview: string;
  automationId?: string;
  automationName?: string;
};

export type IncomingMessageReplyRouterDryRunResultBase = {
  ok: true;
  mode: 'incoming_reply_router_dry_run';
  conversationId: string;
  messageId: string;
  controlMode: ConversationControlMode;
  candidates: IncomingMessageReplyCandidate[];
  decision: {
    type: IncomingMessageReplyDecisionType;
    selectedSource: IncomingMessageReplyCandidateSource | null;
    shouldSendMessage: false;
    reason: string;
  };
};

export type IncomingMessageReplyRouterDryRunResult =
  IncomingMessageReplyRouterDryRunResultBase & {
    sendPolicy: AutomaticReplySendPolicy;
  };
