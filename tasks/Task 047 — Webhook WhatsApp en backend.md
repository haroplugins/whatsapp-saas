# Task 047 — Webhook WhatsApp en backend

## Objetivo
Crear el primer endpoint backend para recibir eventos tipo WhatsApp, sin conectar aún Meta real.

---

## Contexto

- El frontend ya tiene `receiveExternalMessage`.
- El inbox ya trabaja con modelo normalizado.
- Ya existe simulación de webhook en frontend.
- Ahora necesitamos preparar backend real.

---

## Objetivo técnico

Crear en NestJS:

GET /webhooks/whatsapp
POST /webhooks/whatsapp

---

## Requisitos

### 1. GET de verificación

Crear endpoint:

GET /webhooks/whatsapp

Debe leer query params:

- hub.mode
- hub.verify_token
- hub.challenge

Si verify_token coincide con variable de entorno:

WHATSAPP_VERIFY_TOKEN

Responder con hub.challenge.

Si no coincide:

Responder 403.

---

### 2. POST de recepción

Crear endpoint:

POST /webhooks/whatsapp

Por ahora debe:

- recibir body completo
- loguear payload de forma controlada
- devolver 200 OK rápido

No procesar todavía mensajes reales.

---

### 3. Configuración

Añadir variable en `.env.example`:

WHATSAPP_VERIFY_TOKEN="change-me"

---

### 4. Módulo NestJS

Crear módulo/controlador limpio:

- WebhooksModule
- WhatsappWebhookController

---

### 5. Seguridad básica

- No guardar payloads en DB
- No imprimir datos sensibles excesivos
- Solo log mínimo para debug

---

## Importante

- no tocar frontend
- no tocar inbox
- no integrar Meta aún
- no procesar mensajes aún
- solo preparar endpoint

---

## Resultado esperado

- GET verifica token
- POST recibe payload mock
- backend compila
- API sigue funcionando