'use client';

import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';

type Message = {
  id: string;
  sender: 'USER' | 'CLIENT' | 'AUTO';
  content: string;
  createdAt: number;
};

type Conversation = {
  id: string;
  name: string;
  updatedAt: number;
  messages: Message[];
  hasAutoReplied: boolean;
  hasUserReplied: boolean;
  lastAutoReplyAt: number | null;
  isAutoReplyTyping: boolean;
};

type AutomationSchedule = {
  days: number[];
  start: string;
  end: string;
};

type AutomationConfig = {
  enabled: boolean;
  message: string;
  schedule?: AutomationSchedule;
};

type AutomationsState = Record<'welcome' | 'off_hours', AutomationConfig>;

type InboxLayout = {
  leftWidth: number;
  centerWidth: number;
  rightWidth: number;
};

type ActiveResizer = 'left' | 'right';

const mockConversationsStorageKey = 'mockInbox.conversations';
const privateNotesStorageKey = 'mockInbox.privateNotes';
const automationsStorageKey = 'automations';
const layoutStorageKey = 'mockInbox.layout';
const leftPanelMinWidth = 220;
const centerPanelMinWidth = 300;
const rightPanelMinWidth = 220;
const resizerWidth = 12;
const resizableViewportMinWidth = 1180;

const mockCustomerNames = [
  'Cliente Juan',
  'Maria Garcia',
  'Cliente Laura',
  'Carlos Ruiz',
  'Ana Lopez',
  'Cliente Sofia',
];

const mockIncomingMessages = [
  'Hola, queria informacion',
  'Buenas, tengo una duda',
  'Hola, queria saber precios',
  'Me interesa vuestro servicio',
  'Hola, podeis ayudarme?',
];

const defaultAutomationsState: AutomationsState = {
  welcome: {
    enabled: false,
    message: 'Hola, gracias por escribir. Enseguida te respondemos.',
  },
  off_hours: {
    enabled: false,
    message: 'Ahora mismo estamos fuera de horario. Te responderemos en cuanto volvamos.',
  },
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [openActionsConversationId, setOpenActionsConversationId] = useState<string | null>(null);
  const [pendingDeleteConversationId, setPendingDeleteConversationId] = useState<string | null>(
    null,
  );
  const [layout, setLayout] = useState<InboxLayout | null>(null);
  const [isResizableLayout, setIsResizableLayout] = useState(false);
  const [activeResizer, setActiveResizer] = useState<ActiveResizer | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const inboxLayoutRef = useRef<HTMLDivElement | null>(null);
  const automationTimeoutsRef = useRef<Record<string, number>>({});
  const dragStateRef = useRef<{
    startX: number;
    startLayout: InboxLayout;
    type: ActiveResizer;
  } | null>(null);

  const sortedConversations = useMemo(
    () => [...conversations].sort((first, second) => second.updatedAt - first.updatedAt),
    [conversations],
  );

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const isDraftEmpty = draftMessage.trim().length === 0;
  const selectedConversationNote = selectedConversation
    ? privateNotes[selectedConversation.id] ?? ''
    : '';

  useEffect(() => {
    setConversations(readStoredConversations());
    setPrivateNotes(readStoredPrivateNotes());
    setIsHydrated(true);

    return () => {
      Object.values(automationTimeoutsRef.current).forEach((timeoutId) =>
        window.clearTimeout(timeoutId),
      );
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      mockConversationsStorageKey,
      JSON.stringify(conversations),
    );
  }, [conversations, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !layout) {
      return;
    }

    window.localStorage.setItem(layoutStorageKey, JSON.stringify(layout));
  }, [isHydrated, layout]);

  useEffect(() => {
    if (!isHydrated || selectedConversationId) {
      return;
    }

    setSelectedConversationId(sortedConversations[0]?.id ?? null);
  }, [isHydrated, selectedConversationId, sortedConversations]);

  useEffect(() => {
    if (!chatBottomRef.current) {
      return;
    }

    chatBottomRef.current.scrollIntoView({
      block: 'end',
      behavior: 'smooth',
    });
  }, [
    selectedConversation?.isAutoReplyTyping,
    selectedConversation?.messages.length,
    selectedConversationId,
  ]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    function syncLayoutWithViewport() {
      const shouldEnableResizableLayout = window.innerWidth >= resizableViewportMinWidth;
      setIsResizableLayout(shouldEnableResizableLayout);

      if (!shouldEnableResizableLayout) {
        setActiveResizer(null);
        dragStateRef.current = null;
        return;
      }

      const totalPanelWidth = getTotalPanelWidth(inboxLayoutRef.current);

      if (!totalPanelWidth) {
        return;
      }

      setLayout((currentLayout) =>
        normalizeLayout(
          currentLayout ?? readStoredLayout() ?? createDefaultLayout(totalPanelWidth),
          totalPanelWidth,
        ),
      );
    }

    syncLayoutWithViewport();
    window.addEventListener('resize', syncLayoutWithViewport);

    return () => {
      window.removeEventListener('resize', syncLayoutWithViewport);
    };
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

      if (!dragState || !totalPanelWidth) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const nextLayout =
        dragState.type === 'left'
          ? {
              leftWidth: dragState.startLayout.leftWidth + deltaX,
              centerWidth: dragState.startLayout.centerWidth - deltaX,
              rightWidth: dragState.startLayout.rightWidth,
            }
          : {
              leftWidth: dragState.startLayout.leftWidth,
              centerWidth: dragState.startLayout.centerWidth + deltaX,
              rightWidth: dragState.startLayout.rightWidth - deltaX,
            };

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

  const inboxLayoutStyle =
    isResizableLayout && layout
      ? {
          gridTemplateColumns: `${layout.leftWidth}px ${resizerWidth}px ${layout.centerWidth}px ${resizerWidth}px ${layout.rightWidth}px`,
        }
      : undefined;

  function simulateIncomingMessage() {
    const now = Date.now();
    const customerName = getRandomItem(mockCustomerNames);
    const initialMessage = getRandomItem(mockIncomingMessages);
    const conversationId = `mock-conversation-${now}`;

    const conversation: Conversation = {
      id: conversationId,
      name: customerName,
      updatedAt: now,
      messages: [
        {
          id: `mock-message-${now}`,
          sender: 'CLIENT',
          content: initialMessage,
          createdAt: now,
        },
      ],
      hasAutoReplied: false,
      hasUserReplied: false,
      lastAutoReplyAt: null,
      isAutoReplyTyping: false,
    };

    setConversations((currentConversations) => [conversation, ...currentConversations]);
    setSelectedConversationId(conversationId);
    setDraftMessage('');

    scheduleAutomationReply(conversationId);
  }

  function requestDeleteConversation(conversationId: string) {
    setOpenActionsConversationId(null);
    setPendingDeleteConversationId(conversationId);
  }

  function closeDeleteModal() {
    setPendingDeleteConversationId(null);
  }

  function confirmDeleteConversation() {
    if (!pendingDeleteConversationId) {
      return;
    }

    clearAutomationTimeout(pendingDeleteConversationId);

    const nextConversations = conversations.filter(
      (conversation) => conversation.id !== pendingDeleteConversationId,
    );

    setConversations(nextConversations);
    setPendingDeleteConversationId(null);

    if (selectedConversationId === pendingDeleteConversationId) {
      const nextSelectedConversation = nextConversations
        .sort((first, second) => second.updatedAt - first.updatedAt)[0];

      setSelectedConversationId(nextSelectedConversation?.id ?? null);
      setDraftMessage('');
    }

    const nextPrivateNotes = { ...privateNotes };
    delete nextPrivateNotes[pendingDeleteConversationId];

    setPrivateNotes(nextPrivateNotes);
    window.localStorage.setItem(
      privateNotesStorageKey,
      JSON.stringify(nextPrivateNotes),
    );
  }

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId || isDraftEmpty) {
      return;
    }

    clearAutomationTimeout(selectedConversationId);

    const now = Date.now();
    const content = draftMessage.trim();

    setConversations((currentConversations) =>
      currentConversations.map((conversation) => {
        if (conversation.id !== selectedConversationId) {
          return conversation;
        }

        return {
          ...conversation,
          hasUserReplied: true,
          isAutoReplyTyping: false,
          updatedAt: now,
          messages: [
            ...conversation.messages,
            {
              id: `mock-message-${now}`,
              sender: 'USER',
              content,
              createdAt: now,
            },
          ],
        };
      }),
    );
    setDraftMessage('');
  }

  function handlePrivateNoteChange(note: string) {
    if (!selectedConversation) {
      return;
    }

    const nextPrivateNotes = {
      ...privateNotes,
      [selectedConversation.id]: note,
    };

    setPrivateNotes(nextPrivateNotes);
    window.localStorage.setItem(
      privateNotesStorageKey,
      JSON.stringify(nextPrivateNotes),
    );
  }

  function deletePrivateNote() {
    if (!selectedConversation) {
      return;
    }

    const nextPrivateNotes = { ...privateNotes };
    delete nextPrivateNotes[selectedConversation.id];

    setPrivateNotes(nextPrivateNotes);
    window.localStorage.setItem(
      privateNotesStorageKey,
      JSON.stringify(nextPrivateNotes),
    );
  }

  function scheduleAutomationReply(conversationId: string) {
    const automationMessage = getAutomationMessage();

    if (!automationMessage) {
      return;
    }

    setConversations((currentConversations) =>
      currentConversations.map((conversation) => {
        if (conversation.id !== conversationId || !canSendAutoReply(conversation)) {
          return conversation;
        }

        return {
          ...conversation,
          isAutoReplyTyping: true,
        };
      }),
    );

    const delayInMs = getRandomDelay(500, 1200);
    const timeoutId = window.setTimeout(() => {
      const now = Date.now();

      setConversations((currentConversations) => {
        const conversationToUpdate = currentConversations.find(
          (conversation) => conversation.id === conversationId,
        );

        if (!conversationToUpdate || !canSendAutoReply(conversationToUpdate)) {
          return currentConversations.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            return {
              ...conversation,
              isAutoReplyTyping: false,
            };
          });
        }

        return currentConversations.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            hasAutoReplied: true,
            isAutoReplyTyping: false,
            lastAutoReplyAt: now,
            updatedAt: now,
            messages: [
              ...conversation.messages,
              {
                id: `mock-message-auto-${now}`,
                sender: 'AUTO',
                content: automationMessage,
                createdAt: now,
              },
            ],
          };
        });
      });

      clearAutomationTimeout(conversationId);
    }, delayInMs);

    automationTimeoutsRef.current[conversationId] = timeoutId;
  }

  function clearAutomationTimeout(conversationId: string) {
    const timeoutId = automationTimeoutsRef.current[conversationId];

    if (!timeoutId) {
      return;
    }

    window.clearTimeout(timeoutId);
    delete automationTimeoutsRef.current[conversationId];
  }

  function startResizing(type: ActiveResizer, event: ReactMouseEvent<HTMLDivElement>) {
    if (!layout || !isResizableLayout) {
      return;
    }

    event.preventDefault();
    dragStateRef.current = {
      type,
      startX: event.clientX,
      startLayout: layout,
    };
    setActiveResizer(type);
  }

  function getAutomationMessage(): string | null {
    const automations = readStoredAutomations();

    if (
      automations.off_hours.enabled &&
      automations.off_hours.message.trim() &&
      isOutsideConfiguredSchedule(automations.off_hours.schedule)
    ) {
      return automations.off_hours.message.trim();
    }

    if (automations.welcome.enabled && automations.welcome.message.trim()) {
      return automations.welcome.message.trim();
    }

    return null;
  }

  return (
    <section className="inbox-page">
      <div className="dashboard-hero inbox-hero">
        <div>
          <span className="workspace-header__eyebrow">Inbox</span>
          <h2>Responde mensajes como si ya estuvieran entrando.</h2>
          <p>
            Simula conversaciones de clientes, abre el chat y practica respuestas
            sin conectar todavia ningun backend.
          </p>
        </div>
        <button className="button button--primary" type="button" onClick={simulateIncomingMessage}>
          Simular mensaje entrante
        </button>
      </div>

      <div
        ref={inboxLayoutRef}
        className={`inbox-layout inbox-layout--with-notes${
          isResizableLayout ? ' inbox-layout--resizable' : ''
        }`}
        style={inboxLayoutStyle}
      >
        <aside className="inbox-list">
          <div className="inbox-list__header">
            <strong>Conversaciones</strong>
            <span>{sortedConversations.length} chats</span>
          </div>

          <div className="inbox-list__items">
            {sortedConversations.length === 0 ? (
              <div className="inbox-empty inbox-empty--action">
                Aun no tienes conversaciones
                <span>Genera un primer mensaje entrante para ver el inbox en accion.</span>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={simulateIncomingMessage}
                >
                  Simular primer mensaje
                </button>
              </div>
            ) : null}

            {sortedConversations.map((conversation) => {
              const lastMessage = conversation.messages.at(-1);
              const isActive = conversation.id === selectedConversationId;
              const isActionsOpen = conversation.id === openActionsConversationId;

              return (
                <article
                  key={conversation.id}
                  className={`conversation-item${isActive ? ' conversation-item--active' : ''}`}
                >
                  <div className="conversation-item__actions">
                    <button
                      className="conversation-item__action-button"
                      type="button"
                      aria-label={`Eliminar ${conversation.name}`}
                      onClick={() => requestDeleteConversation(conversation.id)}
                    >
                      ×
                    </button>
                    <div className="conversation-item__menu">
                      <button
                        className="conversation-item__action-button"
                        type="button"
                        aria-label={`Abrir acciones de ${conversation.name}`}
                        onClick={() =>
                          setOpenActionsConversationId((currentConversationId) =>
                            currentConversationId === conversation.id ? null : conversation.id,
                          )
                        }
                      >
                        ⋯
                      </button>

                      {isActionsOpen ? (
                        <div className="conversation-item__menu-panel">
                          <button
                            className="conversation-item__menu-option"
                            type="button"
                            onClick={() => requestDeleteConversation(conversation.id)}
                          >
                            Eliminar conversacion
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    className="conversation-item__content"
                    type="button"
                    onClick={() => {
                      setSelectedConversationId(conversation.id);
                      setOpenActionsConversationId(null);
                    }}
                  >
                    <div className="conversation-item__top">
                      <strong>{conversation.name}</strong>
                      <time>{formatMessageTime(conversation.updatedAt)}</time>
                    </div>
                    <span className="conversation-item__preview">
                      {lastMessage?.sender === 'USER'
                        ? 'Tu: '
                        : lastMessage?.sender === 'AUTO'
                          ? 'Auto: '
                          : ''}
                      {lastMessage?.content}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </aside>

        {isResizableLayout ? (
          <div
            className={`inbox-resizer${activeResizer === 'left' ? ' inbox-resizer--active' : ''}`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar conversaciones"
            onMouseDown={(event) => startResizing('left', event)}
          />
        ) : null}

        <section className="chat-panel">
          {selectedConversation ? (
            <>
              <header className="chat-panel__header">
                <div>
                  <strong>{selectedConversation.name}</strong>
                  <span>{selectedConversation.messages.length} mensajes</span>
                </div>
                <span className="conversation-badge conversation-badge--business">
                  Mock
                </span>
              </header>

              <div className="chat-messages">
                {selectedConversation.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`chat-message ${
                      message.sender === 'USER'
                        ? 'chat-message--user'
                        : message.sender === 'AUTO'
                          ? 'chat-message--auto'
                          : 'chat-message--client'
                    }`}
                  >
                    <span className="chat-message__sender">
                      {message.sender === 'USER'
                        ? 'Tu'
                        : message.sender === 'AUTO'
                          ? 'Auto'
                          : selectedConversation.name}
                    </span>
                    <p>{message.content}</p>
                    <time>{formatMessageTime(message.createdAt)}</time>
                  </article>
                ))}

                {selectedConversation.isAutoReplyTyping ? (
                  <article className="chat-typing-indicator">
                    <span className="chat-message__sender">Auto</span>
                    <div className="chat-typing-indicator__bubble" aria-live="polite">
                      <span>Escribiendo</span>
                      <span className="chat-typing-indicator__dots">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  </article>
                ) : null}

                <div ref={chatBottomRef} />
              </div>

              <form className="chat-composer" onSubmit={handleSendMessage}>
                <input
                  name="content"
                  type="text"
                  placeholder="Escribe una respuesta..."
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                />
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={isDraftEmpty}
                >
                  Enviar
                </button>
                <span className="chat-composer__hint">Pulsa Enter para enviar</span>
              </form>
            </>
          ) : (
            <div className="inbox-empty inbox-empty--large">
              Selecciona una conversacion para ver el chat
              <span>O simula un mensaje entrante para empezar.</span>
            </div>
          )}
        </section>

        {isResizableLayout ? (
          <div
            className={`inbox-resizer${activeResizer === 'right' ? ' inbox-resizer--active' : ''}`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar notas"
            onMouseDown={(event) => startResizing('right', event)}
          />
        ) : null}

        <aside className="private-notes-panel">
          {selectedConversation ? (
            <>
              <div className="private-notes-panel__header">
                <div>
                  <strong>Notas privadas</strong>
                  <span>Solo visible para ti</span>
                </div>
                <button
                  className="private-notes-panel__delete"
                  type="button"
                  onClick={deletePrivateNote}
                  disabled={!selectedConversationNote}
                >
                  Borrar
                </button>
              </div>
              <textarea
                className="private-notes-panel__textarea"
                placeholder="Ej: Prefiere que le respondamos por la tarde. Pregunto por precios del plan mensual."
                value={selectedConversationNote}
                onChange={(event) => handlePrivateNoteChange(event.target.value)}
              />
            </>
          ) : (
            <div className="inbox-empty inbox-empty--large">
              Selecciona una conversacion para ver sus notas privadas
              <span>Las notas se guardan en este navegador.</span>
            </div>
          )}
        </aside>
      </div>

      {pendingDeleteConversationId ? (
        <div className="automation-modal-backdrop" role="presentation">
          <div
            className="automation-modal conversation-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-conversation-title"
          >
            <div className="automation-modal__header">
              <div>
                <span className="workspace-header__eyebrow">Accion de bandeja</span>
                <h3 id="delete-conversation-title">¿Eliminar esta conversación?</h3>
              </div>
              <p>Esto solo eliminara la conversacion de esta bandeja de prueba.</p>
            </div>

            <div className="automation-modal__body conversation-delete-modal__actions">
              <button className="button button--ghost" type="button" onClick={closeDeleteModal}>
                Cancelar
              </button>
              <button
                className="button button--primary conversation-delete-modal__confirm"
                type="button"
                onClick={confirmDeleteConversation}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getRandomItem(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)] ?? items[0] ?? 'Cliente';
}

function formatMessageTime(value: number): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function readStoredConversations(): Conversation[] {
  const storedValue = window.localStorage.getItem(mockConversationsStorageKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<Conversation>[];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map((conversation, index) => ({
      id:
        typeof conversation.id === 'string'
          ? conversation.id
          : `mock-conversation-recovered-${index}`,
      name: typeof conversation.name === 'string' ? conversation.name : 'Cliente',
      updatedAt:
        typeof conversation.updatedAt === 'number' ? conversation.updatedAt : Date.now(),
      messages: Array.isArray(conversation.messages) ? conversation.messages : [],
      hasAutoReplied: Boolean(conversation.hasAutoReplied),
      hasUserReplied: Boolean(conversation.hasUserReplied),
      lastAutoReplyAt:
        typeof conversation.lastAutoReplyAt === 'number'
          ? conversation.lastAutoReplyAt
          : null,
      isAutoReplyTyping: false,
    }));
  } catch {
    return [];
  }
}

function readStoredPrivateNotes(): Record<string, string> {
  const storedValue = window.localStorage.getItem(privateNotesStorageKey);

  if (!storedValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Record<string, string>;
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
}

function readStoredAutomations(): AutomationsState {
  const storedValue = window.localStorage.getItem(automationsStorageKey);

  if (!storedValue) {
    return defaultAutomationsState;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<AutomationsState>;

    return {
      welcome: {
        ...defaultAutomationsState.welcome,
        ...parsedValue.welcome,
      },
      off_hours: {
        ...defaultAutomationsState.off_hours,
        ...parsedValue.off_hours,
        schedule: normalizeSchedule(parsedValue.off_hours?.schedule),
      },
    };
  } catch {
    return defaultAutomationsState;
  }
}

function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function canSendAutoReply(conversation: Conversation): boolean {
  return !conversation.hasAutoReplied && !conversation.hasUserReplied;
}

function normalizeSchedule(schedule: unknown): AutomationSchedule | undefined {
  if (!schedule || typeof schedule !== 'object') {
    return undefined;
  }

  const candidate = schedule as Partial<AutomationSchedule>;
  const days = Array.isArray(candidate.days)
    ? candidate.days.filter(isValidDay).sort((firstDay, secondDay) => firstDay - secondDay)
    : [];
  const start = typeof candidate.start === 'string' ? candidate.start : '';
  const end = typeof candidate.end === 'string' ? candidate.end : '';

  if (!days.length || !isValidTimeString(start) || !isValidTimeString(end)) {
    return undefined;
  }

  return {
    days,
    start,
    end,
  };
}

function isOutsideConfiguredSchedule(schedule?: AutomationSchedule): boolean {
  if (!schedule) {
    return true;
  }

  const now = new Date();
  const currentDay = now.getDay();

  if (!schedule.days.includes(currentDay)) {
    return true;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = convertTimeToMinutes(schedule.start);
  const endMinutes = convertTimeToMinutes(schedule.end);

  if (startMinutes === null || endMinutes === null) {
    return true;
  }

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes < startMinutes || currentMinutes > endMinutes;
  }

  return currentMinutes > endMinutes && currentMinutes < startMinutes;
}

function convertTimeToMinutes(value: string): number | null {
  if (!isValidTimeString(value)) {
    return null;
  }

  const [hoursText, minutesText] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  return hours * 60 + minutes;
}

function isValidTimeString(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function isValidDay(day: unknown): day is number {
  return typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6;
}

function readStoredLayout(): InboxLayout | null {
  const storedValue = window.localStorage.getItem(layoutStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<InboxLayout>;

    if (
      typeof parsedValue.leftWidth !== 'number' ||
      typeof parsedValue.centerWidth !== 'number' ||
      typeof parsedValue.rightWidth !== 'number'
    ) {
      return null;
    }

    return {
      leftWidth: parsedValue.leftWidth,
      centerWidth: parsedValue.centerWidth,
      rightWidth: parsedValue.rightWidth,
    };
  } catch {
    return null;
  }
}

function getTotalPanelWidth(element: HTMLDivElement | null): number {
  if (!element) {
    return 0;
  }

  return Math.max(0, Math.floor(element.getBoundingClientRect().width) - resizerWidth * 2);
}

function createDefaultLayout(totalPanelWidth: number): InboxLayout {
  const defaultSideWidth = Math.min(300, Math.max(260, Math.floor(totalPanelWidth * 0.24)));
  return normalizeLayout(
    {
      leftWidth: defaultSideWidth,
      centerWidth: totalPanelWidth - defaultSideWidth * 2,
      rightWidth: defaultSideWidth,
    },
    totalPanelWidth,
  );
}

function normalizeLayout(layout: InboxLayout, totalPanelWidth: number): InboxLayout {
  const minTotalWidth = leftPanelMinWidth + centerPanelMinWidth + rightPanelMinWidth;

  if (totalPanelWidth <= minTotalWidth) {
    return {
      leftWidth: leftPanelMinWidth,
      centerWidth: centerPanelMinWidth,
      rightWidth: rightPanelMinWidth,
    };
  }

  let leftWidth = clampWidth(
    layout.leftWidth,
    leftPanelMinWidth,
    totalPanelWidth - centerPanelMinWidth - rightPanelMinWidth,
  );
  let rightWidth = clampWidth(
    layout.rightWidth,
    rightPanelMinWidth,
    totalPanelWidth - leftWidth - centerPanelMinWidth,
  );
  let centerWidth = totalPanelWidth - leftWidth - rightWidth;

  if (centerWidth < centerPanelMinWidth) {
    const missingWidth = centerPanelMinWidth - centerWidth;
    const leftAdjustment = Math.min(leftWidth - leftPanelMinWidth, missingWidth);
    leftWidth -= leftAdjustment;

    const rightAdjustment = Math.min(
      rightWidth - rightPanelMinWidth,
      missingWidth - leftAdjustment,
    );
    rightWidth -= rightAdjustment;
    centerWidth = totalPanelWidth - leftWidth - rightWidth;
  }

  return {
    leftWidth,
    centerWidth,
    rightWidth,
  };
}

function clampWidth(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
