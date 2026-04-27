# Task 049 — Parser de webhook WhatsApp

## Objetivo
Preparar el backend para interpretar payloads reales de WhatsApp Cloud API y extraer mensajes entrantes en un formato interno normalizado.

---

## Contexto

- Ya existe GET /webhooks/whatsapp para verificación.
- Ya existe POST /webhooks/whatsapp que recibe payload y responde { ok: true }.
- Meta todavía no está conectado porque falta terminar Business Manager.
- Aprovechamos para preparar el parser.

---

## Objetivo técnico

Crear una función/helper que reciba el body completo de Meta y devuelva una lista de mensajes normalizados.

---

## Formato interno esperado

```ts
type ParsedWhatsappMessage = {
  externalConversationId: string;
  externalMessageId?: string;
  contactName?: string;
  from: string;
  type: "text" | "image" | "document" | "audio" | "video" | "unknown";
  text?: string;
  timestamp?: string;
};
Requisitos
1. Crear helper parser

Crear archivo, por ejemplo:

apps/api/src/webhooks/whatsapp-parser.ts

Debe exportar:

parseWhatsappWebhookPayload(payload: unknown): ParsedWhatsappMessage[]
2. Soportar payload Cloud API básico

Extraer mensajes desde estructura típica:

payload.entry[].changes[].value.messages[]

También extraer contactos desde:

payload.entry[].changes[].value.contacts[]
3. Mensajes de texto

Si message.type === "text":

text = message.text.body
4. Otros tipos

Para image/document/audio/video:

mapear type
si document tiene filename, guardarlo en text o campo auxiliar si hace falta
5. Ignorar eventos sin messages

Si payload trae statuses u otros eventos:

devolver []
6. Integrar en POST

En POST /webhooks/whatsapp:

llamar parser
loguear solo resumen:
cantidad de mensajes parseados
from
type
seguir devolviendo { ok: true }
7. Seguridad
no loguear payload completo en producción
no guardar en DB todavía
no enviar respuestas todavía
Resultado esperado

El backend puede recibir payload Meta real y extraer mensajes de forma controlada.