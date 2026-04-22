# Task 006 — Conversations Base (Core Product Start)

## Objetivo
Crear la base de conversaciones que será el núcleo del producto.

---

## Requisitos

### 1. Modelo Prisma

Añadir modelo Conversation:

- id
- tenantId
- phone (string)
- name (nullable)
- status (string)
- isBusiness (boolean)
- createdAt
- updatedAt

Relación:
- pertenece a Tenant

---

### 2. Migración

- generar nueva migración Prisma
- no modificar modelos anteriores

---

### 3. Servicio NestJS

Crear ConversationsModule:

- conversations.service.ts
- conversations.module.ts

Funciones:

- crear conversación
- listar conversaciones por tenant
- obtener conversación por id (validando tenant)

---

### 4. Endpoint básico

Crear:

GET /conversations

Debe:
- estar protegido
- devolver solo conversaciones del tenant actual

---

### 5. Multi-tenant obligatorio

TODAS las queries deben filtrar por:

tenantId = user.tenantId

---

## Importante

- no crear mensajes aún
- no automatizaciones
- no frontend
- no lógica compleja

---

## Resultado esperado

- tabla Conversation creada
- endpoint funcional
- aislamiento por tenant funcionando