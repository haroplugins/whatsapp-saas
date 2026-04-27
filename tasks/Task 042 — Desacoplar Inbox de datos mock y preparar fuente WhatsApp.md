# Task 042 — Desacoplar Inbox de datos mock y preparar fuente WhatsApp

## Objetivo
Preparar el inbox para que en el futuro pueda consumir conversaciones reales de WhatsApp sin rehacer la UI ni la lógica de producto.

---

## Contexto

Actualmente el inbox funciona con datos mock en frontend.
Eso ha servido para validar UX y producto, pero no debemos seguir construyendo lógica sobre un mock acoplado.

Ahora queremos separar:

- UI del inbox
- lógica de estados/notas/archivado
- fuente de datos

La fuente actual será mock, pero debe quedar preparada para cambiar a WhatsApp.

---

## Requisitos

### 1. Crear tipos normalizados

Crear tipos claros para:

```ts
ConversationSource = "mock" | "whatsapp"

NormalizedConversation {
  id: string
  externalId?: string
  source: ConversationSource
  contactName: string
  lastMessagePreview: string
  lastMessageAt: string
  status: "pending" | "done"
  archived: boolean
}

NormalizedMessage {
  id: string
  externalId?: string
  conversationId: string
  source: ConversationSource
  sender: "client" | "user" | "auto"
  type: "text" | "file" | "image" | "audio"
  text?: string
  fileName?: string
  fileUrl?: string
  createdAt: string
}
2. Extraer lógica mock a un adaptador

Crear una capa tipo:

mockInboxSource

o helper similar que haga:

crear conversación mock
crear mensaje mock
cargar conversaciones de localStorage
guardar conversaciones en localStorage
normalizar datos al formato común
3. Preparar interfaz de fuente de datos

Crear una interfaz simple:

InboxSource {
  loadConversations(): NormalizedConversation[]
  saveConversations(conversations): void
}

No hace falta implementar WhatsApp aún.

4. Inbox debe usar los tipos normalizados

Refactor mínimo para que inbox/page.tsx trabaje contra NormalizedConversation y NormalizedMessage, no contra tipos mock dispersos.

5. Mantener comportamiento actual

No debe romper:

simulación de mensajes
auto replies
notas privadas
estados
archivado
filtros
acciones rápidas
edición/borrado
archivos mock
resize de paneles
6. No backend todavía

No integrar API.
No integrar WhatsApp.
No tocar NestJS.
Solo preparar frontend.

Resultado esperado

El usuario no debe notar cambios visuales.

Pero internamente el inbox queda preparado para:

mock source ahora
whatsapp source después