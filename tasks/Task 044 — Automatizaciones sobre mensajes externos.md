# Task 044 — Automatizaciones sobre mensajes externos

## Objetivo
Hacer que los mensajes recibidos por `receiveExternalMessage()` disparen la misma lógica de automatizaciones que los mensajes simulados desde el inbox.

---

## Contexto

- Ya existe `receiveExternalMessage(payload)` en `inbox-source.ts`.
- Ya existe botón dev-only “Simular webhook WA”.
- Ya existen automations configurables en localStorage:
  - welcome
  - off_hours
- Ya existe lógica en inbox para auto replies, delay, typing y control de respuesta.
- Ahora los mensajes externos deben comportarse igual que un mensaje entrante real.

---

## Requisitos

### 1. Entrada externa dispara automations

Cuando se pulse “Simular webhook WA” y entre un mensaje externo:

- debe crearse/actualizarse la conversación
- debe quedar como `pending`
- debe desarchivarse si estaba archivada
- debe evaluar automations
- debe mostrar typing si corresponde
- debe insertar respuesta automática si corresponde

---

### 2. Reutilizar lógica existente

No duplicar lógica.

Si ya existe una función para decidir respuesta automática:
- reutilizarla
- o extraerla a helper dentro del inbox

---

### 3. Mantener reglas actuales

- OFF_hours tiene prioridad sobre welcome
- solo una respuesta automática inicial
- si el usuario ya respondió manualmente, no responder
- typing se cancela si el usuario responde antes del delay

---

### 4. Diferenciar mensaje externo

Los mensajes recibidos vía webhook deben mantener:

```ts
source: "whatsapp"
sender: "client"
5. No romper simulación manual

Debe seguir funcionando:

Simular mensaje entrante
Simular cliente
mensajes manuales
archivos
notas
estados
filtros
archivado
Resultado esperado

Flujo:

Configuro automation en /automations
Voy a /inbox
Pulso “Simular webhook WA”
Entra mensaje externo
Aparece typing
Aparece respuesta automática si corresponde