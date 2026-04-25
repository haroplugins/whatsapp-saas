'use client';
import { type ChangeEvent, type Dispatch, type FormEvent, type MouseEvent as ReactMouseEvent, type MutableRefObject, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import {
  createMockFileMessage,
  createMockTextMessage,
  createMockWhatsappWebhookPayload,
  createRandomMockConversation,
  createRandomMockIncomingMessage,
  getMessagePreview,
  mockInboxSource,
  receiveExternalMessage,
  type NormalizedConversation,
  type NormalizedConversationStatus,
  type NormalizedMessage,
  type NormalizedMessageSender,
  withConversationPreview,
} from '../../../lib/inbox-source';

type Message = NormalizedMessage;
type Conversation = NormalizedConversation;
type ConversationStatus = NormalizedConversationStatus;
type AutomationSchedule = { days: number[]; start: string; end: string };
type AutomationConfig = { enabled: boolean; message: string; schedule?: AutomationSchedule };
type AutomationsState = Record<'welcome' | 'off_hours', AutomationConfig>;
type InboxLayout = { leftWidth: number; centerWidth: number; rightWidth: number };
type ActiveResizer = 'left' | 'right';
type ConversationFilter = 'all' | 'pending' | 'done' | 'archived';

const privateNotesStorageKey = 'mockInbox.privateNotes';
const automationsStorageKey = 'automations';
const layoutStorageKey = 'mockInbox.layout';
const fileInputId = 'mock-inbox-file-input';
const PENDING_DELAY_MS = 2 * 60 * 1000;
const leftPanelMinWidth = 220;
const centerPanelMinWidth = 300;
const rightPanelMinWidth = 220;
const resizerWidth = 12;
const resizableViewportMinWidth = 1180;
const isDevelopment = process.env.NODE_ENV === 'development';
const defaultAutomationsState: AutomationsState = {
  welcome: { enabled: false, message: 'Hola, gracias por escribir. Enseguida te respondemos.' },
  off_hours: { enabled: false, message: 'Ahora mismo estamos fuera de horario. Te responderemos en cuanto volvamos.' },
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [openActionsConversationId, setOpenActionsConversationId] = useState<string | null>(null);
  const [pendingDeleteConversationId, setPendingDeleteConversationId] = useState<string | null>(null);
  const [layout, setLayout] = useState<InboxLayout | null>(null);
  const [isResizableLayout, setIsResizableLayout] = useState(false);
  const [activeResizer, setActiveResizer] = useState<ActiveResizer | null>(null);
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const inboxLayoutRef = useRef<HTMLDivElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const automationTimeoutsRef = useRef<Record<string, number>>({});
  const pendingStatusTimeoutsRef = useRef<Record<string, number>>({});
  const dragStateRef = useRef<{ startX: number; startLayout: InboxLayout; type: ActiveResizer } | null>(null);

  const sortedConversations = useMemo(() => [...conversations].sort((first, second) => {
    if (first.status !== second.status) return getStatusWeight(first.status) - getStatusWeight(second.status);
    return toTimestamp(second.lastMessageAt) - toTimestamp(first.lastMessageAt);
  }), [conversations]);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const isDraftEmpty = draftMessage.trim().length === 0;
  const selectedConversationNote = selectedConversation ? privateNotes[selectedConversation.id] ?? '' : '';
  const conversationCounts = useMemo(() => ({
    all: sortedConversations.filter((conversation) => !conversation.archived).length,
    pending: sortedConversations.filter((conversation) => !conversation.archived && conversation.status === 'pending').length,
    done: sortedConversations.filter((conversation) => !conversation.archived && conversation.status === 'done').length,
    archived: sortedConversations.filter((conversation) => conversation.archived).length,
  }), [sortedConversations]);
  const filteredConversations = useMemo(() => {
    if (activeFilter === 'archived') return sortedConversations.filter((conversation) => conversation.archived);
    if (activeFilter === 'all') return sortedConversations.filter((conversation) => !conversation.archived);
    return sortedConversations.filter((conversation) => !conversation.archived && conversation.status === activeFilter);
  }, [activeFilter, sortedConversations]);

  useEffect(() => {
    setConversations(mockInboxSource.loadConversations());
    setPrivateNotes(readStoredPrivateNotes());
    setIsHydrated(true);
    return () => {
      objectUrlsRef.current.forEach((fileUrl) => window.URL.revokeObjectURL(fileUrl));
      Object.values(automationTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      Object.values(pendingStatusTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    mockInboxSource.saveConversations(conversations);
  }, [conversations, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !layout) return;
    window.localStorage.setItem(layoutStorageKey, JSON.stringify(layout));
  }, [isHydrated, layout]);

  useEffect(() => {
    if (!isHydrated || selectedConversationId) return;
    setSelectedConversationId(sortedConversations[0]?.id ?? null);
  }, [isHydrated, selectedConversationId, sortedConversations]);

  useEffect(() => {
    setEditingMessageId(null);
    setEditingDraft('');
  }, [selectedConversationId]);

  useEffect(() => {
    if (!chatBottomRef.current) return;
    chatBottomRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [selectedConversation?.isAutoReplyTyping, selectedConversation?.messages.length, selectedConversationId]);

  useEffect(() => {
    if (!isHydrated) return;
    function syncLayoutWithViewport() {
      const shouldEnableResizableLayout = window.innerWidth >= resizableViewportMinWidth;
      setIsResizableLayout(shouldEnableResizableLayout);
      if (!shouldEnableResizableLayout) {
        setActiveResizer(null);
        dragStateRef.current = null;
        return;
      }
      const totalPanelWidth = getTotalPanelWidth(inboxLayoutRef.current);
      if (!totalPanelWidth) return;
      setLayout((currentLayout) => normalizeLayout(currentLayout ?? readStoredLayout() ?? createDefaultLayout(totalPanelWidth), totalPanelWidth));
    }
    syncLayoutWithViewport();
    window.addEventListener('resize', syncLayoutWithViewport);
    return () => window.removeEventListener('resize', syncLayoutWithViewport);
  }, [isHydrated]);

  useEffect(() => {
    if (!activeResizer) {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      return;
    }
    function handleMouseMove(event: MouseEvent) {
      const dragState = dragStateRef.current;
      const totalPanelWidth = getTotalPanelWidth(inboxLayoutRef.current);
      if (!dragState || !totalPanelWidth) return;
      const deltaX = event.clientX - dragState.startX;
      const nextLayout = dragState.type === 'left'
        ? { leftWidth: dragState.startLayout.leftWidth + deltaX, centerWidth: dragState.startLayout.centerWidth - deltaX, rightWidth: dragState.startLayout.rightWidth }
        : { leftWidth: dragState.startLayout.leftWidth, centerWidth: dragState.startLayout.centerWidth + deltaX, rightWidth: dragState.startLayout.rightWidth - deltaX };
      setLayout(normalizeLayout(nextLayout, totalPanelWidth));
    }
    function stopResizing() {
      setActiveResizer(null);
      dragStateRef.current = null;
    }
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [activeResizer]);

  useEffect(() => {
    if (!isHydrated) return;
    const expiredConversationIds = conversations.filter((conversation) => conversation.pendingStatusAt !== null && toTimestamp(conversation.pendingStatusAt) <= Date.now()).map((conversation) => conversation.id);
    if (expiredConversationIds.length > 0) {
      setConversations((currentConversations) => currentConversations.map((conversation) => expiredConversationIds.includes(conversation.id) ? { ...conversation, status: 'pending', pendingStatusAt: null } : conversation));
      return;
    }
    conversations.forEach((conversation) => {
      if (conversation.pendingStatusAt === null) {
        clearPendingStatusTimeout(pendingStatusTimeoutsRef, conversation.id);
        return;
      }
      if (pendingStatusTimeoutsRef.current[conversation.id]) return;
      schedulePendingStatusTimeout(setConversations, pendingStatusTimeoutsRef, conversation.id, Math.max(0, toTimestamp(conversation.pendingStatusAt) - Date.now()));
    });
  }, [conversations, isHydrated]);

  const inboxLayoutStyle = isResizableLayout && layout ? { gridTemplateColumns: `${layout.leftWidth}px ${resizerWidth}px ${layout.centerWidth}px ${resizerWidth}px ${layout.rightWidth}px` } : undefined;

  function simulateIncomingMessage() {
    const conversation = createRandomMockConversation();
    setConversations((currentConversations) => [conversation, ...currentConversations]);
    setSelectedConversationId(conversation.id);
    setDraftMessage('');
    scheduleAutomationReply(conversation.id);
  }

  function simulateWhatsappWebhook() {
    mockInboxSource.saveConversations(conversations);
    const receipt = receiveExternalMessage(createMockWhatsappWebhookPayload());
    applyReceivedExternalMessage(receipt.conversations, receipt.conversationId);
  }

  function applyReceivedExternalMessage(nextConversations: Conversation[], conversationId: string) {
    clearPendingStatusTimeout(pendingStatusTimeoutsRef, conversationId);
    setConversations(nextConversations);
    setSelectedConversationId(conversationId);
    setDraftMessage('');
    scheduleAutomationReply(conversationId);
  }

  function simulateIncomingMessageInConversation(conversationId: string) {
    const conversation = conversations.find((currentConversation) => currentConversation.id === conversationId);
    if (!conversation) return;
    const now = new Date();
    if (conversation.archived) {
      clearPendingStatusTimeout(pendingStatusTimeoutsRef, conversationId);
      setConversations((currentConversations) => currentConversations.map((currentConversation) => currentConversation.id === conversationId ? {
        ...withConversationPreview({
          ...currentConversation,
          messages: [...currentConversation.messages, createRandomMockIncomingMessage(conversationId, now)],
        }),
        archived: false,
        status: 'pending',
        pendingStatusAt: null,
      } : currentConversation));
      scheduleAutomationReply(conversationId);
      return;
    }
    const nextPendingStatusAt = conversation.status === 'done' ? new Date(now.getTime() + PENDING_DELAY_MS).toISOString() : conversation.pendingStatusAt;
    setConversations((currentConversations) => currentConversations.map((currentConversation) => currentConversation.id === conversationId ? {
      ...withConversationPreview({
        ...currentConversation,
        messages: [...currentConversation.messages, createRandomMockIncomingMessage(conversationId, now)],
      }),
      pendingStatusAt: nextPendingStatusAt,
    } : currentConversation));
    if (conversation.status === 'done') {
      clearPendingStatusTimeout(pendingStatusTimeoutsRef, conversationId);
      schedulePendingStatusTimeout(setConversations, pendingStatusTimeoutsRef, conversationId, PENDING_DELAY_MS);
    }
  }

  function requestDeleteConversation(conversationId: string) {
    setOpenActionsConversationId(null);
    setPendingDeleteConversationId(conversationId);
  }

  function closeDeleteModal() {
    setPendingDeleteConversationId(null);
  }

  function confirmDeleteConversation() {
    if (!pendingDeleteConversationId) return;
    clearTimeoutById(automationTimeoutsRef, pendingDeleteConversationId);
    clearPendingStatusTimeout(pendingStatusTimeoutsRef, pendingDeleteConversationId);
    const nextConversations = conversations.filter((conversation) => conversation.id !== pendingDeleteConversationId);
    setConversations(nextConversations);
    setPendingDeleteConversationId(null);
    if (selectedConversationId === pendingDeleteConversationId) {
      const nextSelectedConversation = [...nextConversations].sort((first, second) => {
        if (first.status !== second.status) return getStatusWeight(first.status) - getStatusWeight(second.status);
        return toTimestamp(second.lastMessageAt) - toTimestamp(first.lastMessageAt);
      })[0];
      setSelectedConversationId(nextSelectedConversation?.id ?? null);
      setDraftMessage('');
    }
    const nextPrivateNotes = { ...privateNotes };
    delete nextPrivateNotes[pendingDeleteConversationId];
    setPrivateNotes(nextPrivateNotes);
    window.localStorage.setItem(privateNotesStorageKey, JSON.stringify(nextPrivateNotes));
  }

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || isDraftEmpty) return;
    clearTimeoutById(automationTimeoutsRef, selectedConversationId);
    clearPendingStatusTimeout(pendingStatusTimeoutsRef, selectedConversationId);
    const now = new Date();
    const content = draftMessage.trim();
    setConversations((currentConversations) => currentConversations.map((conversation) => conversation.id === selectedConversationId ? {
      ...withConversationPreview({
        ...conversation,
        messages: [...conversation.messages, createMockTextMessage(selectedConversationId, 'user', content, now)],
      }),
      status: 'done',
      pendingStatusAt: null,
      hasUserReplied: true,
      isAutoReplyTyping: false,
    } : conversation));
    setDraftMessage('');
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedConversationId) return;
    clearTimeoutById(automationTimeoutsRef, selectedConversationId);
    clearPendingStatusTimeout(pendingStatusTimeoutsRef, selectedConversationId);
    const now = new Date();
    const fileUrl = window.URL.createObjectURL(file);
    objectUrlsRef.current.push(fileUrl);
    const fileMessage = createMockFileMessage(selectedConversationId, file.name, fileUrl, file.type, now);
    setConversations((currentConversations) => currentConversations.map((conversation) => conversation.id === selectedConversationId ? {
      ...withConversationPreview({
        ...conversation,
        messages: [...conversation.messages, fileMessage],
      }),
      status: 'done',
      pendingStatusAt: null,
      hasUserReplied: true,
      isAutoReplyTyping: false,
    } : conversation));
  }

  function startEditingMessage(message: Message) {
    if (message.type !== 'text' || !isUserSender(message.sender)) return;
    setEditingMessageId(message.id);
    setEditingDraft(message.text ?? '');
  }

  function cancelEditingMessage() {
    setEditingMessageId(null);
    setEditingDraft('');
  }

  function saveEditedMessage(messageId: string) {
    if (!selectedConversationId) return;
    const content = editingDraft.trim();
    if (!content) return;
    const now = new Date().toISOString();
    setConversations((currentConversations) => currentConversations.map((conversation) => conversation.id === selectedConversationId ? {
      ...withConversationPreview({
        ...conversation,
        messages: conversation.messages.map((message) => message.id === messageId && message.type === 'text' && isUserSender(message.sender) ? {
          ...message,
          text: content,
          editedAt: now,
        } : message),
      }),
    } : conversation));
    cancelEditingMessage();
  }

  function deleteOwnMessage(message: Message) {
    if (!selectedConversationId || !isUserSender(message.sender)) return;
    const shouldDelete = window.confirm('Borrar este mensaje?');
    if (!shouldDelete) return;
    if (message.type !== 'text' && message.fileUrl) revokeTrackedObjectUrl(objectUrlsRef, message.fileUrl);
    setConversations((currentConversations) => currentConversations.map((conversation) => conversation.id === selectedConversationId ? {
      ...withConversationPreview({
        ...conversation,
        messages: conversation.messages.filter((currentMessage) => currentMessage.id !== message.id),
      }),
    } : conversation));
    if (editingMessageId === message.id) cancelEditingMessage();
  }

  function handlePrivateNoteChange(note: string) {
    if (!selectedConversation) return;
    const nextPrivateNotes = { ...privateNotes, [selectedConversation.id]: note };
    setPrivateNotes(nextPrivateNotes);
    window.localStorage.setItem(privateNotesStorageKey, JSON.stringify(nextPrivateNotes));
  }

  function deletePrivateNote() {
    if (!selectedConversation) return;
    const nextPrivateNotes = { ...privateNotes };
    delete nextPrivateNotes[selectedConversation.id];
    setPrivateNotes(nextPrivateNotes);
    window.localStorage.setItem(privateNotesStorageKey, JSON.stringify(nextPrivateNotes));
  }

  function scheduleAutomationReply(conversationId: string) {
    const automationMessage = getAutomationMessage();
    if (!automationMessage) return;
    clearTimeoutById(automationTimeoutsRef, conversationId);
    setConversations((currentConversations) => currentConversations.map((conversation) => conversation.id === conversationId && canSendAutoReply(conversation) ? { ...conversation, isAutoReplyTyping: true } : conversation));
    const delayInMs = getRandomDelay(500, 1200);
    const timeoutId = window.setTimeout(() => {
      const now = new Date();
      setConversations((currentConversations) => {
        const conversationToUpdate = currentConversations.find((conversation) => conversation.id === conversationId);
        if (!conversationToUpdate || !canSendAutoReply(conversationToUpdate)) {
          return currentConversations.map((conversation) => conversation.id === conversationId ? { ...conversation, isAutoReplyTyping: false } : conversation);
        }
        return currentConversations.map((conversation) => conversation.id === conversationId ? {
          ...withConversationPreview({
            ...conversation,
            messages: [...conversation.messages, createMockTextMessage(conversationId, 'auto', automationMessage, now)],
          }),
          hasAutoReplied: true,
          isAutoReplyTyping: false,
          lastAutoReplyAt: now.toISOString(),
        } : conversation);
      });
      clearTimeoutById(automationTimeoutsRef, conversationId);
    }, delayInMs);
    automationTimeoutsRef.current[conversationId] = timeoutId;
  }

  function markConversationStatus(conversationId: string, status: ConversationStatus) {
    clearPendingStatusTimeout(pendingStatusTimeoutsRef, conversationId);
    setConversations((currentConversations) => currentConversations.map((conversation) => conversation.id === conversationId ? { ...conversation, status, pendingStatusAt: null } : conversation));
    setOpenActionsConversationId(null);
  }

  function toggleConversationArchived(conversationId: string) {
    const conversation = conversations.find((currentConversation) => currentConversation.id === conversationId);
    if (!conversation) return;
    const nextArchived = !conversation.archived;
    setConversations((currentConversations) => currentConversations.map((currentConversation) => currentConversation.id === conversationId ? {
      ...currentConversation,
      archived: nextArchived,
    } : currentConversation));
    setOpenActionsConversationId(null);
    const nextFilterIncludesConversation = doesFilterIncludeConversation({ ...conversation, archived: nextArchived }, activeFilter);
    if (selectedConversationId === conversationId && !nextFilterIncludesConversation) {
      const nextSelectedConversation = sortedConversations.find((currentConversation) => currentConversation.id !== conversationId && doesFilterIncludeConversation(currentConversation, activeFilter));
      setSelectedConversationId(nextSelectedConversation?.id ?? null);
      setDraftMessage('');
    }
  }

  function startResizing(type: ActiveResizer, event: ReactMouseEvent<HTMLDivElement>) {
    if (!layout || !isResizableLayout) return;
    event.preventDefault();
    dragStateRef.current = { type, startX: event.clientX, startLayout: layout };
    setActiveResizer(type);
  }

  function getAutomationMessage(): string | null {
    const automations = readStoredAutomations();
    if (automations.off_hours.enabled && automations.off_hours.message.trim() && isOutsideConfiguredSchedule(automations.off_hours.schedule)) return automations.off_hours.message.trim();
    if (automations.welcome.enabled && automations.welcome.message.trim()) return automations.welcome.message.trim();
    return null;
  }

  return (
    <section className="inbox-page">
      <div className="dashboard-hero inbox-hero">
        <div>
          <span className="workspace-header__eyebrow">Inbox</span>
          <h2>Responde mensajes como si ya estuvieran entrando.</h2>
          <p>Simula conversaciones de clientes, abre el chat y practica respuestas sin conectar todavia ningun backend.</p>
        </div>
        <div className="inbox-hero__actions">
          {isDevelopment ? <button className="button button--ghost" type="button" onClick={simulateWhatsappWebhook}>Simular webhook WA</button> : null}
          <button className="button button--primary" type="button" onClick={simulateIncomingMessage}>Simular mensaje entrante</button>
        </div>
      </div>
      <div ref={inboxLayoutRef} className={`inbox-layout inbox-layout--with-notes${isResizableLayout ? ' inbox-layout--resizable' : ''}`} style={inboxLayoutStyle}>
        <aside className="inbox-list">
          <div className="inbox-list__header">
            <strong>Conversaciones</strong>
            <span>{filteredConversations.length} chats</span>
          </div>
          <div className="inbox-filters" role="tablist" aria-label="Filtrar conversaciones">
            <button className={`inbox-filter-chip${activeFilter === 'all' ? ' inbox-filter-chip--active' : ''}`} type="button" onClick={() => setActiveFilter('all')}>
              Todas ({conversationCounts.all})
            </button>
            <button className={`inbox-filter-chip${activeFilter === 'pending' ? ' inbox-filter-chip--active' : ''}`} type="button" onClick={() => setActiveFilter('pending')}>
              Pendientes ({conversationCounts.pending})
            </button>
            <button className={`inbox-filter-chip${activeFilter === 'done' ? ' inbox-filter-chip--active' : ''}`} type="button" onClick={() => setActiveFilter('done')}>
              Atendidas ({conversationCounts.done})
            </button>
            <button className={`inbox-filter-chip${activeFilter === 'archived' ? ' inbox-filter-chip--active' : ''}`} type="button" onClick={() => setActiveFilter('archived')}>
              Archivadas ({conversationCounts.archived})
            </button>
          </div>
          <div className="inbox-list__items">
            {filteredConversations.length === 0 ? (
              <div className="inbox-empty inbox-empty--action">
                {conversationCounts.all === 0 && conversationCounts.archived === 0 ? 'Aun no tienes conversaciones' : 'No hay conversaciones en este filtro'}
                <span>{conversationCounts.all === 0 && conversationCounts.archived === 0 ? 'Genera un primer mensaje entrante para ver el inbox en accion.' : 'Prueba con otro filtro para ver mas conversaciones.'}</span>
                {conversationCounts.all === 0 && conversationCounts.archived === 0 ? <button className="button button--primary" type="button" onClick={simulateIncomingMessage}>Simular primer mensaje</button> : null}
              </div>
            ) : null}
            {filteredConversations.map((conversation) => {
              const lastMessage = conversation.messages.at(-1);
              const isActive = conversation.id === selectedConversationId;
              const isActionsOpen = conversation.id === openActionsConversationId;
              return (
                <article key={conversation.id} className={`conversation-item conversation-item--${conversation.status}${isActive ? ' conversation-item--active' : ''}`}>
                  <button className="conversation-item__content" type="button" onClick={() => { setSelectedConversationId(conversation.id); setOpenActionsConversationId(null); }}>
                    <span className={`conversation-item__avatar conversation-item__avatar--${getAvatarTone(conversation.contactName)}`}>
                      {getConversationInitial(conversation.contactName)}
                    </span>
                    <div className="conversation-item__body">
                      <div className="conversation-item__identity">
                        <strong>{conversation.contactName}</strong>
                        <span className={`conversation-status-badge ${conversation.status === 'done' ? 'conversation-status-badge--done' : ''}`} title={getConversationStatusTooltip(conversation.status)}>{conversation.status === 'pending' ? 'Pendiente' : 'Atendida'}</span>
                      </div>
                      <span className="conversation-item__preview">{getConversationMessagePreview(lastMessage)}</span>
                    </div>
                    </button>
                    <div className="conversation-item__side">
                      <div className="conversation-item__actions">
                        <div className="conversation-item__quick-actions">
                          <button
                            className="conversation-item__quick-action"
                            type="button"
                            title={conversation.status === 'pending' ? 'Marcar como atendida' : 'Marcar como pendiente'}
                            aria-label={conversation.status === 'pending' ? 'Marcar como atendida' : 'Marcar como pendiente'}
                            onClick={() => markConversationStatus(conversation.id, conversation.status === 'pending' ? 'done' : 'pending')}
                          >
                            {conversation.status === 'pending' ? '✓' : '↩'}
                          </button>
                          <button
                            className="conversation-item__quick-action"
                            type="button"
                            title={conversation.archived ? 'Desarchivar conversación' : 'Archivar conversación'}
                            aria-label={conversation.archived ? 'Desarchivar conversación' : 'Archivar conversación'}
                            onClick={() => toggleConversationArchived(conversation.id)}
                          >
                            {conversation.archived ? '↑' : '↓'}
                          </button>
                        </div>
                        <div className="conversation-item__menu">
                          <button className="conversation-item__action-button" type="button" aria-label={`Abrir acciones de ${conversation.contactName}`} onClick={() => setOpenActionsConversationId((currentConversationId) => currentConversationId === conversation.id ? null : conversation.id)}>...</button>
                          {isActionsOpen ? (
                          <div className="conversation-item__menu-panel">
                            <button className="conversation-item__menu-option" type="button" onClick={() => markConversationStatus(conversation.id, 'pending')}>Marcar como pendiente</button>
                            <button className="conversation-item__menu-option" type="button" onClick={() => markConversationStatus(conversation.id, 'done')}>Marcar como atendida</button>
                            <button className="conversation-item__menu-option" type="button" onClick={() => toggleConversationArchived(conversation.id)}>{conversation.archived ? 'Desarchivar conversacion' : 'Archivar conversacion'}</button>
                            <button className="conversation-item__menu-option" type="button" onClick={() => requestDeleteConversation(conversation.id)}>Eliminar conversacion</button>
                          </div>
                        ) : null}
                      </div>
                      <button className="conversation-item__action-button" type="button" aria-label={`Eliminar ${conversation.contactName}`} onClick={() => requestDeleteConversation(conversation.id)}>x</button>
                    </div>
                    <time className="conversation-item__time">{formatMessageTime(conversation.lastMessageAt)}</time>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
        {isResizableLayout ? <div className={`inbox-resizer${activeResizer === 'left' ? ' inbox-resizer--active' : ''}`} role="separator" aria-orientation="vertical" aria-label="Redimensionar conversaciones" onMouseDown={(event) => startResizing('left', event)} /> : null}
        <section className="chat-panel">
          {selectedConversation ? (
            <>
              <header className="chat-panel__header">
                <div><strong>{selectedConversation.contactName}</strong><span>{selectedConversation.messages.length} mensajes</span></div>
                <div className="chat-panel__header-actions">
                  <button className="button button--ghost chat-panel__header-button" type="button" onClick={() => simulateIncomingMessageInConversation(selectedConversation.id)}>Simular cliente</button>
                  <span className={`conversation-status-badge ${selectedConversation.status === 'done' ? 'conversation-status-badge--done' : ''}`} title={getConversationStatusTooltip(selectedConversation.status)}>{selectedConversation.status === 'pending' ? 'Pendiente' : 'Atendida'}</span>
                  <span className="conversation-badge conversation-badge--business">Mock</span>
                </div>
              </header>
              <div className="chat-messages">
                {selectedConversation.messages.map((message) => (
                  <article key={message.id} className={`chat-message ${getMessageBubbleClass(message)}`}>
                    <div className="chat-message__topline">
                      <span className="chat-message__sender">{getMessageSenderLabel(message, selectedConversation.contactName)}</span>
                      {isUserSender(message.sender) ? (
                        <div className="chat-message__actions" aria-label="Acciones del mensaje">
                          {message.type === 'text' ? (
                            <button className="chat-message__action" type="button" title="Editar mensaje" aria-label="Editar mensaje" onClick={() => startEditingMessage(message)}>
                              Editar
                            </button>
                          ) : null}
                          <button className="chat-message__action chat-message__action--danger" type="button" title="Borrar mensaje" aria-label="Borrar mensaje" onClick={() => deleteOwnMessage(message)}>
                            Borrar
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {message.type !== 'text' ? (
                      <div className="chat-file-message">
                        {message.fileUrl && isImageFileMessage(message) ? (
                          // eslint-disable-next-line @next/next/no-img-element -- Blob previews are browser-local object URLs, so Next Image cannot optimize them.
                          <img className="chat-file-message__preview" src={message.fileUrl} alt={message.fileName ?? 'Archivo adjunto'} />
                        ) : (
                          <div className="chat-file-message__document" aria-hidden="true">{'\uD83D\uDCC4'}</div>
                        )}
                        <div className="chat-file-message__body">
                          <span className="chat-file-message__name">{message.fileName ?? 'Archivo adjunto'}</span>
                          {!message.fileUrl ? <span className="chat-file-message__status">Preview no disponible tras recargar</span> : null}
                        </div>
                      </div>
                    ) : editingMessageId === message.id ? (
                      <div className="chat-message-editor">
                        <textarea className="chat-message-editor__textarea" value={editingDraft} onChange={(event) => setEditingDraft(event.target.value)} aria-label="Editar mensaje" />
                        <div className="chat-message-editor__actions">
                          <button className="chat-message-editor__button" type="button" onClick={cancelEditingMessage}>Cancelar</button>
                          <button className="chat-message-editor__button chat-message-editor__button--primary" type="button" onClick={() => saveEditedMessage(message.id)} disabled={!editingDraft.trim()}>Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <p>{message.text}</p>
                    )}
                    {message.type === 'text' && message.editedAt ? <span className="chat-message__edited">Editado</span> : null}
                    <time>{formatMessageTime(message.createdAt)}</time>
                  </article>
                ))}
                {selectedConversation.isAutoReplyTyping ? (
                  <article className="chat-typing-indicator">
                    <span className="chat-message__sender">Auto</span>
                    <div className="chat-typing-indicator__bubble" aria-live="polite">
                      <span>Escribiendo</span>
                      <span className="chat-typing-indicator__dots"><span /><span /><span /></span>
                    </div>
                  </article>
                ) : null}
                <div ref={chatBottomRef} />
              </div>
              <form className="chat-composer" onSubmit={handleSendMessage}>
                <input id={fileInputId} className="chat-composer__file-input" type="file" aria-label="Adjuntar archivo" onChange={handleFileSelected} />
                <label className="chat-composer__attach" htmlFor={fileInputId} title="Adjuntar archivo" aria-label="Adjuntar archivo">
                  {'\uD83D\uDCCE'}
                </label>
                <input name="content" type="text" placeholder="Escribe una respuesta..." value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} />
                <button className="button button--primary" type="submit" disabled={isDraftEmpty}>Enviar</button>
                <span className="chat-composer__hint">Pulsa Enter para enviar</span>
              </form>
            </>
          ) : (
            <div className="inbox-empty inbox-empty--large">Selecciona una conversacion para ver el chat<span>O simula un mensaje entrante para empezar.</span></div>
          )}
        </section>
        {isResizableLayout ? <div className={`inbox-resizer${activeResizer === 'right' ? ' inbox-resizer--active' : ''}`} role="separator" aria-orientation="vertical" aria-label="Redimensionar notas" onMouseDown={(event) => startResizing('right', event)} /> : null}
        <aside className="private-notes-panel">
          {selectedConversation ? (
            <>
              <div className="private-notes-panel__header" title="Solo visible para ti">
                <div><strong>Notas privadas</strong><span>Solo visible para ti</span></div>
                <button className="private-notes-panel__delete" type="button" onClick={deletePrivateNote} disabled={!selectedConversationNote}>Borrar</button>
              </div>
              <textarea className="private-notes-panel__textarea" placeholder="Ej: Prefiere que le respondamos por la tarde. Pregunto por precios del plan mensual." value={selectedConversationNote} onChange={(event) => handlePrivateNoteChange(event.target.value)} />
            </>
          ) : (
            <div className="inbox-empty inbox-empty--large">Selecciona una conversacion para ver sus notas privadas<span>Las notas se guardan en este navegador.</span></div>
          )}
        </aside>
      </div>
      {pendingDeleteConversationId ? (
        <div className="automation-modal-backdrop" role="presentation">
          <div className="automation-modal conversation-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-conversation-title">
            <div className="automation-modal__header">
              <div><span className="workspace-header__eyebrow">Accion de bandeja</span><h3 id="delete-conversation-title">Eliminar esta conversacion?</h3></div>
              <p>Esto solo eliminara la conversacion de esta bandeja de prueba.</p>
            </div>
            <div className="automation-modal__body conversation-delete-modal__actions">
              <button className="button button--ghost" type="button" onClick={closeDeleteModal}>Cancelar</button>
              <button className="button button--primary conversation-delete-modal__confirm" type="button" onClick={confirmDeleteConversation}>Eliminar</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getConversationInitial(name: string): string {
  return name.trim().charAt(name.trim().startsWith('Cliente ') ? 8 : 0).toUpperCase() || 'C';
}
function getAvatarTone(name: string): 'amber' | 'mint' | 'lavender' {
  const seed = name.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  const tones: Array<'amber' | 'mint' | 'lavender'> = ['amber', 'mint', 'lavender'];
  return tones[seed % tones.length] ?? 'amber';
}
function getConversationStatusTooltip(status: ConversationStatus): string {
  return status === 'pending'
    ? 'Requiere tu atencion'
    : 'Ya has respondido o revisado esta conversacion';
}
function getStatusWeight(status: ConversationStatus): number { return status === 'pending' ? 0 : 1; }
function formatMessageTime(value: string): string { return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
function isUserSender(sender: NormalizedMessageSender): boolean { return sender === 'user'; }
function getMessageBubbleClass(message: Message): string {
  if (isUserSender(message.sender)) return 'chat-message--user';
  if (message.sender === 'auto') return 'chat-message--auto';
  return 'chat-message--client';
}
function getMessageSenderLabel(message: Message, clientName: string): string {
  if (isUserSender(message.sender)) return 'Tu';
  if (message.sender === 'auto') return 'Auto';
  return clientName;
}
function getConversationMessagePreview(message: Message | undefined): string { return getMessagePreview(message); }
function isImageFileMessage(message: Message): boolean {
  if (message.type === 'image' || message.fileMimeType?.startsWith('image/')) return true;
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(message.fileName ?? '');
}
function revokeTrackedObjectUrl(store: MutableRefObject<string[]>, fileUrl: string) {
  window.URL.revokeObjectURL(fileUrl);
  store.current = store.current.filter((currentFileUrl) => currentFileUrl !== fileUrl);
}
function clearTimeoutById(store: MutableRefObject<Record<string, number>>, key: string) {
  const timeoutId = store.current[key];
  if (!timeoutId) return;
  window.clearTimeout(timeoutId);
  delete store.current[key];
}
function clearPendingStatusTimeout(store: MutableRefObject<Record<string, number>>, key: string) { clearTimeoutById(store, key); }
function schedulePendingStatusTimeout(setConversations: Dispatch<SetStateAction<Conversation[]>>, store: MutableRefObject<Record<string, number>>, conversationId: string, delayInMs: number) {
  const timeoutId = window.setTimeout(() => {
    setConversations((currentConversations) => currentConversations.map((conversation) => conversation.id === conversationId ? { ...conversation, status: 'pending', pendingStatusAt: null } : conversation));
    clearPendingStatusTimeout(store, conversationId);
  }, delayInMs);
  store.current[conversationId] = timeoutId;
}
function readStoredPrivateNotes(): Record<string, string> {
  const storedValue = window.localStorage.getItem(privateNotesStorageKey);
  if (!storedValue) return {};
  try {
    const parsedValue = JSON.parse(storedValue) as Record<string, string>;
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch { return {}; }
}
function readStoredAutomations(): AutomationsState {
  const storedValue = window.localStorage.getItem(automationsStorageKey);
  if (!storedValue) return defaultAutomationsState;
  try {
    const parsedValue = JSON.parse(storedValue) as Partial<AutomationsState>;
    return {
      welcome: { ...defaultAutomationsState.welcome, ...parsedValue.welcome },
      off_hours: { ...defaultAutomationsState.off_hours, ...parsedValue.off_hours, schedule: normalizeSchedule(parsedValue.off_hours?.schedule) },
    };
  } catch { return defaultAutomationsState; }
}
function getRandomDelay(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function canSendAutoReply(conversation: Conversation): boolean { return !conversation.hasAutoReplied && !conversation.hasUserReplied; }
function doesFilterIncludeConversation(conversation: Conversation, filter: ConversationFilter): boolean {
  if (filter === 'archived') return conversation.archived;
  if (filter === 'all') return !conversation.archived;
  return !conversation.archived && conversation.status === filter;
}
function normalizeSchedule(schedule: unknown): AutomationSchedule | undefined {
  if (!schedule || typeof schedule !== 'object') return undefined;
  const candidate = schedule as Partial<AutomationSchedule>;
  const days = Array.isArray(candidate.days) ? candidate.days.filter(isValidDay).sort((firstDay, secondDay) => firstDay - secondDay) : [];
  const start = typeof candidate.start === 'string' ? candidate.start : '';
  const end = typeof candidate.end === 'string' ? candidate.end : '';
  if (!days.length || !isValidTimeString(start) || !isValidTimeString(end)) return undefined;
  return { days, start, end };
}
function isOutsideConfiguredSchedule(schedule?: AutomationSchedule): boolean {
  if (!schedule) return true;
  const now = new Date();
  const currentDay = now.getDay();
  if (!schedule.days.includes(currentDay)) return true;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = convertTimeToMinutes(schedule.start);
  const endMinutes = convertTimeToMinutes(schedule.end);
  if (startMinutes === null || endMinutes === null) return true;
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return currentMinutes < startMinutes || currentMinutes > endMinutes;
  return currentMinutes > endMinutes && currentMinutes < startMinutes;
}
function convertTimeToMinutes(value: string): number | null {
  if (!isValidTimeString(value)) return null;
  const [hoursText, minutesText] = value.split(':');
  return Number(hoursText) * 60 + Number(minutesText);
}
function isValidTimeString(value: string): boolean { return /^\d{2}:\d{2}$/.test(value); }
function isValidDay(day: unknown): day is number { return typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6; }
function readStoredLayout(): InboxLayout | null {
  const storedValue = window.localStorage.getItem(layoutStorageKey);
  if (!storedValue) return null;
  try {
    const parsedValue = JSON.parse(storedValue) as Partial<InboxLayout>;
    if (typeof parsedValue.leftWidth !== 'number' || typeof parsedValue.centerWidth !== 'number' || typeof parsedValue.rightWidth !== 'number') return null;
    return { leftWidth: parsedValue.leftWidth, centerWidth: parsedValue.centerWidth, rightWidth: parsedValue.rightWidth };
  } catch { return null; }
}
function getTotalPanelWidth(element: HTMLDivElement | null): number {
  if (!element) return 0;
  return Math.max(0, Math.floor(element.getBoundingClientRect().width) - resizerWidth * 2);
}
function createDefaultLayout(totalPanelWidth: number): InboxLayout {
  const defaultSideWidth = Math.min(300, Math.max(260, Math.floor(totalPanelWidth * 0.24)));
  return normalizeLayout({ leftWidth: defaultSideWidth, centerWidth: totalPanelWidth - defaultSideWidth * 2, rightWidth: defaultSideWidth }, totalPanelWidth);
}
function normalizeLayout(layout: InboxLayout, totalPanelWidth: number): InboxLayout {
  const minTotalWidth = leftPanelMinWidth + centerPanelMinWidth + rightPanelMinWidth;
  if (totalPanelWidth <= minTotalWidth) return { leftWidth: leftPanelMinWidth, centerWidth: centerPanelMinWidth, rightWidth: rightPanelMinWidth };
  let leftWidth = clampWidth(layout.leftWidth, leftPanelMinWidth, totalPanelWidth - centerPanelMinWidth - rightPanelMinWidth);
  let rightWidth = clampWidth(layout.rightWidth, rightPanelMinWidth, totalPanelWidth - leftWidth - centerPanelMinWidth);
  let centerWidth = totalPanelWidth - leftWidth - rightWidth;
  if (centerWidth < centerPanelMinWidth) {
    const missingWidth = centerPanelMinWidth - centerWidth;
    const leftAdjustment = Math.min(leftWidth - leftPanelMinWidth, missingWidth);
    leftWidth -= leftAdjustment;
    const rightAdjustment = Math.min(rightWidth - rightPanelMinWidth, missingWidth - leftAdjustment);
    rightWidth -= rightAdjustment;
    centerWidth = totalPanelWidth - leftWidth - rightWidth;
  }
  return { leftWidth, centerWidth, rightWidth };
}
function clampWidth(value: number, min: number, max: number): number { return Math.min(Math.max(value, min), max); }
