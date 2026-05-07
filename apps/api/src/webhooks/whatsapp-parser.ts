export type ParsedWhatsappMessage = {
  externalConversationId: string;
  externalMessageId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  contactName?: string;
  from: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'unknown';
  text?: string;
  timestamp?: string;
};

type WhatsappContact = {
  wa_id?: unknown;
  profile?: {
    name?: unknown;
  };
};

export function parseWhatsappWebhookPayload(payload: unknown): ParsedWhatsappMessage[] {
  const parsedMessages: ParsedWhatsappMessage[] = [];
  const entries = readArray(readRecord(payload).entry);

  for (const entry of entries) {
    const changes = readArray(readRecord(entry).changes);
    for (const change of changes) {
      const value = readRecord(readRecord(change).value);
      const metadata = readRecord(value.metadata);
      const phoneNumberId = readString(metadata.phone_number_id);
      const displayPhoneNumber = readString(metadata.display_phone_number);
      const messages = readArray(value.messages);
      if (!messages.length) continue;

      const contacts = readArray(value.contacts).map((contact) => readRecord(contact) as WhatsappContact);
      for (const messageValue of messages) {
        const message = readRecord(messageValue);
        const from = readString(message.from);
        if (!from) continue;

        const contact = contacts.find((currentContact) => readString(currentContact.wa_id) === from);
        parsedMessages.push({
          externalConversationId: from,
          externalMessageId: readString(message.id),
          phoneNumberId,
          displayPhoneNumber,
          contactName: readString(contact?.profile?.name),
          from,
          type: parseMessageType(readString(message.type)),
          text: parseMessageText(message),
          timestamp: parseTimestamp(readString(message.timestamp)),
        });
      }
    }
  }

  return parsedMessages;
}

function parseMessageType(type: string | undefined): ParsedWhatsappMessage['type'] {
  if (type === 'text' || type === 'image' || type === 'document' || type === 'audio' || type === 'video') return type;
  return 'unknown';
}

function parseMessageText(message: Record<string, unknown>): string | undefined {
  const type = readString(message.type);
  if (type === 'text') return readString(readRecord(message.text).body);
  if (type === 'document') return readString(readRecord(message.document).filename);
  return undefined;
}

function parseTimestamp(timestamp: string | undefined): string | undefined {
  if (!timestamp) return undefined;
  if (!/^\d+$/.test(timestamp)) return timestamp;

  const unixTimestamp = Number(timestamp);
  if (!Number.isSafeInteger(unixTimestamp)) return timestamp;

  const timestampInMs = timestamp.length <= 10 ? unixTimestamp * 1000 : unixTimestamp;
  const date = new Date(timestampInMs);
  return Number.isNaN(date.getTime()) ? timestamp : date.toISOString();
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
