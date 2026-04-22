# Task 007 — Messages Base (Chat System Start)

## Objetivo
Crear la base de mensajes dentro de una conversación.

---

## Requisitos

### 1. Modelo Prisma

Añadir modelo Message:

- id
- conversationId
- sender (string: "user" | "client")
- content (text)
- createdAt

Relación:
- pertenece a Conversation

---

### 2. Migración

- generar migración nueva
- no tocar modelos anteriores

---

### 3. Servicio NestJS

Crear MessageModule:

- messages.service.ts
- messages.module.ts

Funciones:

- crear mensaje
- listar mensajes por conversación

---

### 4. Endpoint

GET /conversations/:id/messages

Debe:
- estar protegido
- validar tenant
- devolver mensajes ordenados por fecha

---

### 5. Seguridad

Antes de devolver mensajes:
- comprobar que la conversación pertenece al tenant del usuario

---

## Importante

- no integrar WhatsApp aún
- no automatizaciones
- no IA
- solo base de chat

---

## Resultado esperado

- tabla Message creada
- relación con Conversation
- endpoint funcional