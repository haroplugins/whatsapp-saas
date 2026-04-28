export type ConversationSource = 'mock' | 'whatsapp';
export type NormalizedConversationStatus = 'pending' | 'done';
export type NormalizedConversationControlMode = 'none' | 'ai' | 'human';
export type NormalizedMessageSender = 'client' | 'user' | 'auto';
export type NormalizedMessageType = 'text' | 'file' | 'image' | 'audio';

export type NormalizedMessage = {
  id: string;
  externalId?: string;
  conversationId: string;
  source: ConversationSource;
  sender: NormalizedMessageSender;
  type: NormalizedMessageType;
  text?: string;
  fileName?: string;
  fileUrl?: string;
  fileMimeType?: string;
  createdAt: string;
  editedAt?: string;
};

export type NormalizedConversation = {
  id: string;
  externalId?: string;
  source: ConversationSource;
  contactName: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  status: NormalizedConversationStatus;
  controlMode?: NormalizedConversationControlMode;
  archived: boolean;
  pendingStatusAt: string | null;
  messages: NormalizedMessage[];
  hasAutoReplied: boolean;
  hasUserReplied: boolean;
  lastAutoReplyAt: string | null;
  isAutoReplyTyping: boolean;
};

export type InboxSource = {
  loadConversations(): NormalizedConversation[];
  saveConversations(conversations: NormalizedConversation[]): void;
};

export type ExternalMessagePayload = {
  externalConversationId: string;
  externalMessageId?: string;
  persistedConversationId?: string;
  controlMode?: NormalizedConversationControlMode;
  contactName: string;
  message: string;
  timestamp: string;
};

export type ExternalMessageReceipt = {
  conversations: NormalizedConversation[];
  conversationId: string;
  previousConversationId?: string;
};

const mockConversationsStorageKey = 'mockInbox.conversations';
const mockCustomerNames = ['Cliente Juan', 'Maria Garcia', 'Cliente Laura', 'Carlos Ruiz', 'Ana Lopez', 'Cliente Sofia'];
const mockIncomingMessages = ['Hola, queria informacion', 'Buenas, tengo una duda', 'Hola, queria saber precios', 'Me interesa vuestro servicio', 'Hola, podeis ayudarme?'];
const mockWhatsappContacts = ['WA Marta', 'WA Diego', 'WA Paula', 'WA Hector', 'WA Lucia'];
const mockWhatsappMessages = ['Hola desde WhatsApp', 'Necesito ayuda con un pedido', 'Queria consultar disponibilidad', 'Me pasais mas informacion?', 'Tengo una pregunta rapida'];

export const mockInboxSource: InboxSource = {
  loadConversations() {
    return loadMockConversations();
  },
  saveConversations(conversations) {
    saveMockConversations(conversations);
  },
};

export function createMockConversation(contactName: string, firstMessageText: string, now = new Date()): NormalizedConversation {
  const conversationId = `mock-conversation-${now.getTime()}`;
  const message = createMockTextMessage(conversationId, 'client', firstMessageText, now);
  return withConversationPreview({
    id: conversationId,
    source: 'mock',
    contactName,
    lastMessagePreview: '',
    lastMessageAt: now.toISOString(),
    status: 'pending',
    archived: false,
    pendingStatusAt: null,
    messages: [message],
    hasAutoReplied: false,
    hasUserReplied: false,
    lastAutoReplyAt: null,
    isAutoReplyTyping: false,
  });
}

export function createRandomMockConversation(now = new Date()): NormalizedConversation {
  return createMockConversation(getRandomItem(mockCustomerNames), getRandomItem(mockIncomingMessages), now);
}

export function createRandomMockIncomingMessage(conversationId: string, now = new Date()): NormalizedMessage {
  return createMockTextMessage(conversationId, 'client', getRandomItem(mockIncomingMessages), now);
}

export function createMockWhatsappWebhookPayload(now = new Date()): ExternalMessagePayload {
  const contactName = getRandomItem(mockWhatsappContacts);
  return {
    externalConversationId: `wa-${slugifyId(contactName)}`,
    contactName,
    message: getRandomItem(mockWhatsappMessages),
    timestamp: now.toISOString(),
  };
}

export function createMockTextMessage(
  conversationId: string,
  sender: NormalizedMessageSender,
  text: string,
  now = new Date(),
): NormalizedMessage {
  return {
    id: `mock-message-${sender}-${now.getTime()}`,
    conversationId,
    source: 'mock',
    sender,
    type: 'text',
    text,
    createdAt: now.toISOString(),
  };
}

export function createMockFileMessage(
  conversationId: string,
  fileName: string,
  fileUrl: string,
  fileMimeType = '',
  now = new Date(),
): NormalizedMessage {
  return {
    id: `mock-message-file-${now.getTime()}`,
    conversationId,
    source: 'mock',
    sender: 'user',
    type: fileMimeType.startsWith('image/') ? 'image' : 'file',
    fileName,
    fileUrl,
    fileMimeType,
    createdAt: now.toISOString(),
  };
}

export function receiveExternalMessage(payload: ExternalMessagePayload): ExternalMessageReceipt {
  const conversations = mockInboxSource.loadConversations();
  const timestamp = normalizePayloadTimestamp(payload.timestamp);
  const existingConversation = conversations.find((conversation) => (
    conversation.externalId === payload.externalConversationId ||
    (payload.persistedConversationId ? conversation.id === payload.persistedConversationId : false)
  ));
  const conversationId = payload.persistedConversationId ?? existingConversation?.id ?? createWhatsappConversationId(payload.externalConversationId, timestamp);
  const previousConversationId = existingConversation && existingConversation.id !== conversationId ? existingConversation.id : undefined;
  const message = createWhatsappTextMessage(conversationId, payload, timestamp);
  const existingMessages = (existingConversation?.messages ?? []).map((currentMessage) => ({
    ...currentMessage,
    conversationId,
  }));
  const hasMessageAlready = payload.externalMessageId
    ? existingMessages.some((currentMessage) => currentMessage.externalId === payload.externalMessageId)
    : false;
  const nextConversation = withConversationPreview({
    ...(existingConversation ?? createWhatsappConversation(payload, conversationId, timestamp)),
    id: conversationId,
    contactName: payload.contactName.trim() || existingConversation?.contactName || 'Cliente WhatsApp',
    source: 'whatsapp',
    externalId: payload.externalConversationId,
    controlMode: payload.controlMode ?? existingConversation?.controlMode ?? (payload.persistedConversationId ? 'none' : undefined),
    status: 'pending',
    archived: false,
    pendingStatusAt: null,
    messages: hasMessageAlready ? existingMessages : [...existingMessages, message],
  });
  const nextConversations = existingConversation
    ? conversations.map((conversation) => conversation.id === existingConversation.id ? nextConversation : conversation)
    : [nextConversation, ...conversations];

  mockInboxSource.saveConversations(nextConversations);
  return { conversations: nextConversations, conversationId, previousConversationId };
}

export function withConversationPreview(conversation: NormalizedConversation): NormalizedConversation {
  const lastMessage = conversation.messages.at(-1);
  return {
    ...conversation,
    lastMessagePreview: getMessagePreview(lastMessage),
    lastMessageAt: lastMessage?.createdAt ?? conversation.lastMessageAt,
  };
}

export function getMessagePreview(message: NormalizedMessage | undefined): string {
  if (!message) return '';
  const prefix = message.sender === 'user' ? 'Tu: ' : message.sender === 'auto' ? 'Auto: ' : '';
  if (message.type === 'text') return `${prefix}${message.text ?? ''}`;
  return `${prefix}Archivo: ${message.fileName ?? 'Archivo adjunto'}`;
}

export function saveMockConversations(conversations: NormalizedConversation[]): void {
  window.localStorage.setItem(mockConversationsStorageKey, JSON.stringify(conversations.map(sanitizeConversationForStorage)));
}

export function loadMockConversations(): NormalizedConversation[] {
  const storedValue = window.localStorage.getItem(mockConversationsStorageKey);
  if (!storedValue) return [];
  try {
    const parsedValue = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsedValue)) return [];
    return parsedValue.map(normalizeStoredConversation).map(withConversationPreview);
  } catch {
    return [];
  }
}

function sanitizeConversationForStorage(conversation: NormalizedConversation): NormalizedConversation {
  return withConversationPreview({
    ...conversation,
    isAutoReplyTyping: false,
    messages: conversation.messages.map(sanitizeMessageForStorage),
  });
}

function sanitizeMessageForStorage(message: NormalizedMessage): NormalizedMessage {
  if (message.type === 'text' || message.type === 'audio') return message;
  return {
    id: message.id,
    externalId: message.externalId,
    conversationId: message.conversationId,
    source: message.source,
    sender: message.sender,
    type: message.type,
    fileName: message.fileName,
    fileMimeType: message.fileMimeType,
    createdAt: message.createdAt,
  };
}

function normalizeStoredConversation(value: unknown, index: number): NormalizedConversation {
  const candidate = toRecord(value);
  const id = readString(candidate.id, `mock-conversation-recovered-${index}`);
  const pendingStatusAt = readIsoDate(candidate.pendingStatusAt);
  const isPendingDelayExpired = pendingStatusAt !== null && Date.parse(pendingStatusAt) <= Date.now();
  const legacyUpdatedAt = readDate(candidate.updatedAt);
  const messages = Array.isArray(candidate.messages)
    ? candidate.messages.map((message, messageIndex) => normalizeStoredMessage(message, id, messageIndex))
    : [];
  return {
    id,
    externalId: readOptionalString(candidate.externalId),
    source: readConversationSource(candidate.source),
    contactName: readString(candidate.contactName, readString(candidate.name, 'Cliente')),
    lastMessagePreview: readString(candidate.lastMessagePreview, ''),
    lastMessageAt: readIsoDate(candidate.lastMessageAt) ?? legacyUpdatedAt ?? new Date().toISOString(),
    status: readConversationStatus(candidate.status) && !isPendingDelayExpired ? candidate.status : 'pending',
    controlMode: readConversationControlMode(candidate.controlMode),
    archived: Boolean(candidate.archived),
    pendingStatusAt: isPendingDelayExpired ? null : pendingStatusAt,
    messages,
    hasAutoReplied: Boolean(candidate.hasAutoReplied),
    hasUserReplied: Boolean(candidate.hasUserReplied),
    lastAutoReplyAt: readIsoDate(candidate.lastAutoReplyAt),
    isAutoReplyTyping: false,
  };
}

function normalizeStoredMessage(value: unknown, conversationId: string, index: number): NormalizedMessage {
  const candidate = toRecord(value);
  const sender = readMessageSender(candidate.sender);
  const legacyCreatedAt = readDate(candidate.createdAt);
  const createdAt = readIsoDate(candidate.createdAt) ?? legacyCreatedAt ?? new Date().toISOString();
  const type = readMessageType(candidate.type, candidate.fileMimeType);
  if (type !== 'text') {
    return {
      id: readString(candidate.id, `mock-message-file-recovered-${index}`),
      externalId: readOptionalString(candidate.externalId),
      conversationId,
      source: readConversationSource(candidate.source),
      sender: sender === 'client' || sender === 'auto' ? 'user' : sender,
      type,
      fileName: readString(candidate.fileName, 'Archivo adjunto'),
      fileMimeType: readOptionalString(candidate.fileMimeType),
      createdAt,
    };
  }
  return {
    id: readString(candidate.id, `mock-message-recovered-${index}`),
    externalId: readOptionalString(candidate.externalId),
    conversationId,
    source: readConversationSource(candidate.source),
    sender,
    type: 'text',
    text: readString(candidate.text, readString(candidate.content, '')),
    createdAt,
    editedAt: readIsoDate(candidate.editedAt) ?? readDate(candidate.editedAt) ?? undefined,
  };
}

function createWhatsappConversation(payload: ExternalMessagePayload, conversationId: string, now: Date): NormalizedConversation {
  return {
    id: conversationId,
    externalId: payload.externalConversationId,
    source: 'whatsapp',
    contactName: payload.contactName.trim() || 'Cliente WhatsApp',
    lastMessagePreview: '',
    lastMessageAt: now.toISOString(),
    status: 'pending',
    controlMode: payload.controlMode ?? (payload.persistedConversationId ? 'none' : undefined),
    archived: false,
    pendingStatusAt: null,
    messages: [],
    hasAutoReplied: false,
    hasUserReplied: false,
    lastAutoReplyAt: null,
    isAutoReplyTyping: false,
  };
}

function createWhatsappTextMessage(conversationId: string, payload: ExternalMessagePayload, now: Date): NormalizedMessage {
  return {
    id: `wa-message-${slugifyId(payload.externalConversationId)}-${now.getTime()}`,
    externalId: payload.externalMessageId ?? `wa-message-${now.getTime()}`,
    conversationId,
    source: 'whatsapp',
    sender: 'client',
    type: 'text',
    text: payload.message,
    createdAt: now.toISOString(),
  };
}

function createWhatsappConversationId(externalConversationId: string, now: Date): string {
  return `wa-conversation-${slugifyId(externalConversationId)}-${now.getTime()}`;
}

function normalizePayloadTimestamp(value: string): Date {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? new Date() : new Date(timestamp);
}

function readMessageType(value: unknown, fileMimeType: unknown): NormalizedMessageType {
  if (value === 'image' || (value === 'file' && typeof fileMimeType === 'string' && fileMimeType.startsWith('image/'))) return 'image';
  if (value === 'file' || value === 'audio') return value;
  return 'text';
}

function readMessageSender(value: unknown): NormalizedMessageSender {
  if (value === 'USER' || value === 'user') return 'user';
  if (value === 'AUTO' || value === 'auto') return 'auto';
  return 'client';
}

function readConversationStatus(value: unknown): value is NormalizedConversationStatus {
  return value === 'pending' || value === 'done';
}

function readConversationControlMode(value: unknown): NormalizedConversationControlMode | undefined {
  if (value === 'NONE' || value === 'none') return 'none';
  if (value === 'AI' || value === 'ai') return 'ai';
  if (value === 'HUMAN' || value === 'human') return 'human';
  return undefined;
}

function readConversationSource(value: unknown): ConversationSource {
  return value === 'whatsapp' ? 'whatsapp' : 'mock';
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function readDate(value: unknown): string | null {
  if (typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function getRandomItem(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)] ?? items[0] ?? 'Cliente';
}

function slugifyId(value: string): string {
  const normalizedValue = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalizedValue || 'external';
}
