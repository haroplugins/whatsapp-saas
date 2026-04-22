# Task 015 — Status-based Automations

## Objetivo
Permitir ejecutar automatizaciones cuando cambia el estado de una conversación.

---

## Requisitos

### 1. Trigger

TriggerType.STATUS_CHANGE

triggerValue ejemplo:
"INTERESTED"
"CLOSED"

---

### 2. Integración

En:

conversations.service.ts

Cuando se actualiza status:

→ comprobar automatizaciones

---

### 3. Lógica

Si:
triggerType = STATUS_CHANGE
triggerValue = nuevo status

→ ejecutar acción

---

### 4. Acción

ActionType.SEND_MESSAGE

crear mensaje automático

---

### 5. Seguridad

- validar tenant
- evitar loops

---

## Importante

- no colas aún
- ejecución directa

---

## Resultado esperado

cambiar estado → dispara automatización