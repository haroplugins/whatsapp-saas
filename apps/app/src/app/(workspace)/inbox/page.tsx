'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Message = {
  id: string;
  sender: 'USER' | 'CLIENT';
  content: string;
  createdAt: number;
};

type Conversation = {
  id: string;
  name: string;
  updatedAt: number;
  messages: Message[];
};

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

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const sortedConversations = useMemo(
    () => [...conversations].sort((first, second) => second.updatedAt - first.updatedAt),
    [conversations],
  );

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const isDraftEmpty = draftMessage.trim().length === 0;

  useEffect(() => {
    if (!chatBottomRef.current) {
      return;
    }

    chatBottomRef.current.scrollIntoView({
      block: 'end',
      behavior: 'smooth',
    });
  }, [selectedConversation?.messages.length, selectedConversationId]);

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
    };

    setConversations((currentConversations) => [conversation, ...currentConversations]);
    setSelectedConversationId(conversationId);
    setDraftMessage('');
  }

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId || isDraftEmpty) {
      return;
    }

    const now = Date.now();
    const content = draftMessage.trim();

    setConversations((currentConversations) =>
      currentConversations.map((conversation) => {
        if (conversation.id !== selectedConversationId) {
          return conversation;
        }

        return {
          ...conversation,
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

      <div className="inbox-layout">
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

              return (
                <button
                  key={conversation.id}
                  className={`conversation-item${isActive ? ' conversation-item--active' : ''}`}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <div className="conversation-item__top">
                    <strong>{conversation.name}</strong>
                    <time>{formatMessageTime(conversation.updatedAt)}</time>
                  </div>
                  <span className="conversation-item__preview">
                    {lastMessage?.sender === 'USER' ? 'Tu: ' : ''}
                    {lastMessage?.content}
                  </span>
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
                        : 'chat-message--client'
                    }`}
                  >
                    <span className="chat-message__sender">
                      {message.sender === 'USER' ? 'Tu' : selectedConversation.name}
                    </span>
                    <p>{message.content}</p>
                    <time>{formatMessageTime(message.createdAt)}</time>
                  </article>
                ))}
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
      </div>
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
