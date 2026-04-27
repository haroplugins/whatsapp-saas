# Task 043 — Simulación webhook WhatsApp

## Objetivo
Permitir que el sistema reciba “mensajes externos” simulando un webhook de WhatsApp, para validar el flujo real de entrada de datos.

---

## Contexto

- El inbox ya está desacoplado de los datos mock.
- Existe mockInboxSource.
- El sistema funciona con conversaciones internas.
- Ahora queremos simular entrada externa.

---

## Objetivo real

Simular esto:

WhatsApp → webhook → nuestro sistema → inbox

---

## Requisitos

### 1. Crear función de entrada externa

Crear función tipo:

receiveExternalMessage(payload)

Ejemplo de payload:

```ts
{
  externalConversationId: string
  contactName: string
  message: string
  timestamp: string
}
2. Lógica de ingestión

Cuando entra un mensaje externo:

Caso 1 — conversación existe
buscar por externalConversationId
añadir mensaje tipo:
sender: "client"
source: "whatsapp"
actualizar:
lastMessagePreview
lastMessageAt
status → pending
archived → false
Caso 2 — conversación NO existe
crear nueva conversación normalizada:
source: "whatsapp"
externalId: externalConversationId
añadir mensaje inicial
3. Integración con adaptador

Esta lógica debe vivir en:

inbox-source.ts (preferible)
o helper relacionado
4. Simulación desde UI (temporal)

Añadir botón en UI (solo para desarrollo):

👉 “Simular webhook WA”

Al hacer click:

llamar a receiveExternalMessage()
usar datos mock:
id random
nombre random
mensaje random
5. No romper
inbox actual
simulación existente
automations
estados
notas
archivado
6. Persistencia
guardar cambios en localStorage vía adaptador
Resultado esperado

El usuario verá:

nuevas conversaciones que parecen externas
mensajes que entran como “cliente”
sistema reacciona igual que con mensajes actuales