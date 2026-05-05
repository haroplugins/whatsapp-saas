import type { MessageSender } from '@prisma/client';
import type { IncomingMessageReplyCandidateSource } from '../incoming-message-router/incoming-message-router.types';

export type AutomaticReplySendPolicyBlockReason =
  | 'CONFLICT_MULTIPLE_REPLIES'
  | 'CONTROL_MODE_BLOCKED'
  | 'NO_REPLY'
  | 'NO_SELECTED_SOURCE'
  | 'CONTROL_MODE_HUMAN'
  | 'CONTROL_MODE_NOT_AI'
  | 'AUTOMATIC_REPLIES_DISABLED'
  | 'BOOKING_ADVISOR_AUTOREPLY_DISABLED'
  | 'PLAN_NOT_ALLOWED'
  | 'SMART_BOOKING_DISABLED'
  | 'CLASSIC_AUTOMATION_AUTOREPLY_NOT_SUPPORTED'
  | 'ALREADY_SENT_FOR_TRIGGERING_MESSAGE'
  | 'CONVERSATION_COOLDOWN_ACTIVE'
  | 'CONVERSATION_DAILY_LIMIT_REACHED'
  | 'TENANT_HOURLY_LIMIT_REACHED'
  | 'TENANT_DAILY_LIMIT_REACHED';

export type AutomaticReplySendPolicy = {
  eligibleToSend: boolean;
  dryRunOnly: true;
  wouldUseSender: MessageSender | null;
  selectedSource: IncomingMessageReplyCandidateSource | null;
  blockReasons: AutomaticReplySendPolicyBlockReason[];
  limits: {
    cooldownSeconds: number;
    maxPerConversationDay: number;
    maxPerTenantHour: number;
    maxPerTenantDay: number;
  };
};
