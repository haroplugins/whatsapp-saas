import { apiFetch } from './api';

export type ConversationDraftSource = 'MANUAL' | 'BOOKING_ADVISOR';
export type ConversationDraftStatus = 'ACTIVE' | 'APPLIED' | 'DISCARDED';

export type ConversationDraft = {
  id: string;
  tenantId: string;
  conversationId: string;
  userId: string | null;
  content: string;
  source: ConversationDraftSource;
  status: ConversationDraftStatus;
  createdAt: string;
  updatedAt: string;
};

export type ConversationDraftResponse = {
  draft: ConversationDraft | null;
};

export type BookingAdvisorDraftSavedResponse = {
  ok: true;
  mode: 'advisor_draft_saved';
  conversationId: string;
  messageId: string;
  draft: ConversationDraft;
  advisor: unknown;
};

export function fetchConversationDraft(
  conversationId: string,
): Promise<ConversationDraftResponse> {
  return apiFetch<ConversationDraftResponse>(
    `/conversations/${conversationId}/draft`,
  );
}

export function deleteConversationDraft(
  conversationId: string,
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/conversations/${conversationId}/draft`, {
    method: 'DELETE',
  });
}

export function saveBookingAdvisorDraft(
  conversationId: string,
): Promise<BookingAdvisorDraftSavedResponse> {
  return apiFetch<BookingAdvisorDraftSavedResponse>(
    `/booking-agent/conversations/${conversationId}/advisor/save-draft`,
    {
      method: 'POST',
    },
  );
}
