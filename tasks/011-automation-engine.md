# Task 011 — Automation Engine (MVP)

## Objetivo
Ejecutar automatizaciones básicas cuando ocurre un evento en el sistema.

---

## Requisitos

### 1. Trigger simple

Cuando se crea un mensaje:

- comprobar automatizaciones del tenant
- si triggerType = KEYWORD
- y triggerValue está en el mensaje

---

### 2. Acción

Si se cumple:

- actionType = SEND_MESSAGE
- crear nuevo mensaje automático

sender = "user"

---

### 3. Integración

Integrar en:

messages.service.ts

Después de crear mensaje:
→ ejecutar lógica de automatización

---

### 4. Seguridad

- solo automatizaciones del tenant
- no afectar otros tenants

---

### 5. Limitaciones

- solo KEYWORD
- solo SEND_MESSAGE
- no loops infinitos

---

## Importante

- no IA
- no colas aún
- ejecución directa

---

## Resultado esperado

- escribir "hola"
→ sistema responde automáticamente