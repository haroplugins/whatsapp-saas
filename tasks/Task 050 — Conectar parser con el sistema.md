Task 050 — Conectar parser con el sistema

👉 Aquí damos el salto clave:

Webhook → Parser → Frontend (Inbox)
🎯 Objetivo

Cuando el backend reciba un mensaje:

👉 que llegue automáticamente al inbox
👉 como si fuera “Simular webhook WA”

🧠 Idea clave

Ya tienes:

parser backend ✔️
receiveExternalMessage (frontend) ✔️

👉 ahora hay que conectarlos

🧩 Estrategia (sin romper nada)

Como no tenemos aún DB ni push realtime:

👉 usamos un endpoint puente

🧱 Paso 1 — Endpoint temporal

Crear en backend:

GET /webhooks/whatsapp/messages

Que devuelva:

ParsedWhatsappMessage[]

Guardados en memoria (array simple)

🧱 Paso 2 — Guardar mensajes en memoria

En POST webhook:

const parsed = parseWhatsappWebhookPayload(body);
store.push(...parsed);
🧱 Paso 3 — Frontend polling

En inbox:

cada 3–5 segundos
llamar:
/api/webhooks/whatsapp/messages
por cada mensaje:

llamar a:

receiveExternalMessage(...)
⚠️ Importante
evitar duplicados (usar externalMessageId)
limpiar mensajes después de leerlos