'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../../../lib/api';

type Conversation = {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  isBusiness: boolean;
};

type Message = {
  id: string;
  sender: 'USER' | 'CLIENT';
  content: string;
  createdAt: string;
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      setIsLoadingConversations(true);
      setConversationsError(null);

      try {
        const response = await apiFetch<Conversation[]>('/conversations');

        if (!isMounted) {
          return;
        }

        setConversations(response);
        setSelectedConversationId((currentSelectedConversationId) => {
          if (
            currentSelectedConversationId &&
            response.some((conversation) => conversation.id === currentSelectedConversationId)
          ) {
            return currentSelectedConversationId;
          }

          return response[0]?.id ?? null;
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setConversationsError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudieron cargar las conversaciones.',
        );
      } finally {
        if (isMounted) {
          setIsLoadingConversations(false);
        }
      }
    }

    void loadConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setMessagesError(null);
      setIsLoadingMessages(false);
      return;
    }

    void loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!chatBottomRef.current) {
      return;
    }

    chatBottomRef.current.scrollIntoView({
      block: 'end',
      behavior: 'smooth',
    });
  }, [messages, isLoadingMessages, selectedConversationId]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const isDraftEmpty = useMemo(() => draftMessage.trim().length === 0, [draftMessage]);

  async function loadMessages(conversationId: string): Promise<void> {
    setIsLoadingMessages(true);
    setMessagesError(null);

    try {
      const response = await apiFetch<Message[]>(
        `/conversations/${conversationId}/messages`,
      );

      setMessages(response);
    } catch (loadError) {
      setMessagesError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los mensajes.',
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId) {
      return;
    }

    const content = draftMessage.trim();

    if (!content) {
      return;
    }

    if (isSendingMessage) {
      return;
    }

    setIsSendingMessage(true);
    setMessagesError(null);

    try {
      await apiFetch(`/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        body: {
          content,
        },
      });

      setDraftMessage('');
      await loadMessages(selectedConversationId);
    } catch (sendError) {
      setMessagesError(
        sendError instanceof Error
          ? sendError.message
          : 'No se pudo enviar el mensaje.',
      );
    } finally {
      setIsSendingMessage(false);
    }
  }

  return (
    <section className="inbox-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Inbox</span>
          <h2>Conversaciones reales del tenant</h2>
          <p>
            La bandeja ya consume conversaciones y mensajes del backend en una
            vista simple tipo chat.
          </p>
        </div>
      </div>

      <div className="inbox-layout">
        <aside className="inbox-list">
          <div className="inbox-list__header">
            <strong>Conversaciones</strong>
            <span>{isLoadingConversations ? 'Cargando...' : `${conversations.length} items`}</span>
          </div>

          {conversationsError ? <p className="form-error">{conversationsError}</p> : null}

          <div className="inbox-list__items">
            {isLoadingConversations ? (
              <>
                <div className="conversation-skeleton" />
                <div className="conversation-skeleton" />
                <div className="conversation-skeleton" />
              </>
            ) : null}

            {!isLoadingConversations && conversations.length === 0 ? (
              <div className="inbox-empty">
                No hay conversaciones todavia.
                <span>Cuando entren nuevos chats apareceran aqui.</span>
              </div>
            ) : null}

            {conversations.map((conversation) => {
              const isActive = conversation.id === selectedConversationId;

              return (
                <button
                  key={conversation.id}
                  className={`conversation-item${isActive ? ' conversation-item--active' : ''}`}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <div className="conversation-item__top">
                    <strong>{conversation.name || conversation.phone}</strong>
                    <span
                      className={`conversation-badge ${
                        conversation.isBusiness
                          ? 'conversation-badge--business'
                          : 'conversation-badge--personal'
                      }`}
                    >
                      {conversation.isBusiness ? 'Business' : 'Personal'}
                    </span>
                  </div>
                  <span className="conversation-item__phone">{conversation.phone}</span>
                  <span className="conversation-item__status">{conversation.status}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="chat-panel">
          {selectedConversation ? (
            <>
              <header className="chat-panel__header">
                <div>
                  <strong>{selectedConversation.name || selectedConversation.phone}</strong>
                  <span>{selectedConversation.phone}</span>
                </div>
                <div className="chat-panel__meta">
                  <span className="chat-panel__status">{selectedConversation.status}</span>
                  <span
                    className={`conversation-badge ${
                      selectedConversation.isBusiness
                        ? 'conversation-badge--business'
                        : 'conversation-badge--personal'
                    }`}
                  >
                    {selectedConversation.isBusiness ? 'Business' : 'Personal'}
                  </span>
                </div>
              </header>

              {messagesError ? <p className="form-error">{messagesError}</p> : null}

              <div ref={chatMessagesRef} className="chat-messages">
                {isLoadingMessages ? (
                  <>
                    <div className="message-skeleton message-skeleton--client" />
                    <div className="message-skeleton message-skeleton--user" />
                    <div className="message-skeleton message-skeleton--client" />
                  </>
                ) : null}

                {!isLoadingMessages && messages.length === 0 ? (
                  <div className="inbox-empty">
                    Esta conversacion aun no tiene mensajes.
                    <span>Puedes enviar la primera respuesta desde abajo.</span>
                  </div>
                ) : null}

                {!isLoadingMessages
                  ? messages.map((message) => (
                      <article
                        key={message.id}
                        className={`chat-message ${
                          message.sender === 'USER'
                            ? 'chat-message--user'
                            : 'chat-message--client'
                        }`}
                      >
                        <span className="chat-message__sender">
                          {message.sender === 'USER' ? 'User' : 'Client'}
                        </span>
                        <p>{message.content}</p>
                        <time>{formatMessageTime(message.createdAt)}</time>
                      </article>
                    ))
                  : null}
                <div ref={chatBottomRef} />
              </div>

              <form className="chat-composer" onSubmit={handleSendMessage}>
                <input
                  name="content"
                  type="text"
                  placeholder="Escribe una respuesta..."
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  disabled={!selectedConversationId || isSendingMessage}
                />
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={!selectedConversationId || isSendingMessage || isDraftEmpty}
                >
                  {isSendingMessage ? 'Enviando...' : 'Enviar'}
                </button>
                <span className="chat-composer__hint">
                  {isSendingMessage ? 'Sending...' : 'Pulsa Enter para enviar'}
                </span>
              </form>
            </>
          ) : (
            <div className="inbox-empty inbox-empty--large">
              Selecciona una conversacion para ver el chat.
              <span>La columna derecha mostrara aqui el historial completo.</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}
